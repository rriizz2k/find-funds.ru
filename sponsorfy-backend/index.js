// Import required libraries
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { fromBuffer } = require('file-type');
const multer = require('multer');
const path = require('path');
const cors = require("cors");
const { MeiliSearch } = require('meilisearch');
const axios = require('axios');


const meiliClient = new MeiliSearch({
    host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
    apiKey: process.env.MEILI_API_KEY || 'supersecretkey'
});

const videoIndex = meiliClient.index('videos');
const userIndex = meiliClient.index('users');

// **Функция обновления индекса видео**
const updateVideoIndex = async (videoData) => {
    try {
        await videoIndex.addDocuments([videoData]);
        console.log(`Видео добавлено в индекс: ${videoData.title}`);
    } catch (error) {
        console.error('Ошибка при обновлении MeiliSearch:', error);
    }
};

// **Функция обновления индекса пользователей**
const updateUserIndex = async (userData) => {
    try {
        await userIndex.addDocuments([userData]);
        console.log(`Пользователь добавлен в индекс: ${userData.name}`);
    } catch (error) {
        console.error('Ошибка при обновлении MeiliSearch:', error);
    }
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to parse JSON
app.use(express.json());



app.use(cors({
    origin: "http://localhost:5173", // Разрешаем запросы с фронтенда
    methods: ["GET", "POST", "PATCH", "DELETE"], // Добавляем PATCH
    allowedHeaders: ["Content-Type", "Authorization"], // Разрешаем нужные заголовки
    credentials: true
}));


// Connect to MySQL database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to database');
    }
});

// Middleware to verify JWT
function authenticateJWT(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Для локального тестирования
    }
});

// Проверка подключения при запуске
transporter.verify((error) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server Ready');
    }
});

// Configure Multer storage
// Функция для создания папок, если их нет
const ensureDirectoryExistence = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Разрешённые MIME-типы
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "video/mp4"];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".mp4"];
const FORBIDDEN_EXTENSIONS = [".exe", ".sh", ".php", ".js", ".bat", ".cmd", ".py"];

// Конфигурация multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "uploads/";

        if (file.mimetype.startsWith("image")) {
            if (file.fieldname === "avatar") {
                uploadPath += "avatars/";
            } else if (file.fieldname === "banner") {
                uploadPath += "banners/";
            } else if (file.fieldname === "media") {
                uploadPath += "media/";
            } else {
                uploadPath += "previews/";
            }
        } else {
            uploadPath += "videos/";
        }

        ensureDirectoryExistence(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
    }
});

// Фильтр загрузки файлов
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Запрещаем опасные расширения
    if (FORBIDDEN_EXTENSIONS.includes(fileExtension)) {
        return cb(new Error("Этот тип файла запрещен"), false);
    }

    // Разрешены только изображения и видео
    if (!ALLOWED_EXTENSIONS.includes(fileExtension) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Недопустимый формат файла"), false);
    }

    cb(null, true);
};

// Создаём middleware загрузки файлов с проверками
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Ограничение размера (10MB)
    fileFilter
});

module.exports = upload;

// Middleware для проверки JWT
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const secretKey = process.env.JWT_SECRET; // Используем ключ из .env
        if (!secretKey) {
            console.error("JWT_SECRET is not set in .env file");
            return res.status(500).json({ message: "Internal server error" });
        }

        const decoded = jwt.verify(token.split(" ")[1], secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        res.status(401).json({ message: "Invalid token" });
    }
};


// Эндпоинт для получения информации о текущем пользователе
app.get("/users/me", authMiddleware, (req, res) => {
    const userId = req.user.id;
    
    const sql = `SELECT * FROM users WHERE id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error fetching user data:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result[0]);
    });
});

module.exports = app;
module.exports = upload;

// Эндпоинт для обновления профиля пользователя
app.patch("/users/me", authMiddleware, upload.fields([{ name: "avatar" }, { name: "banner" }]), (req, res) => {
    const userId = req.user.id;
    const { name, banner, avatar, bio, twitter, instagram, telegram } = req.body;

    let updateFields = [];
    let values = [];

    if (name) { updateFields.push("`name` = ?"); values.push(name); }
    if (bio) { updateFields.push("bio = ?"); values.push(bio); }
    if (twitter) { updateFields.push("twitter = ?"); values.push(twitter); }
    if (instagram) { updateFields.push("instagram = ?"); values.push(instagram); }
    if (telegram) { updateFields.push("telegram = ?"); values.push(telegram); }
    if (banner) { updateFields.push("banner = ?"); values.push(banner); }
    if (avatar) { updateFields.push("avatar = ?"); values.push(avatar); }

    if (req.files?.avatar) {
        const avatarPath = `/uploads/avatars/${req.files.avatar[0].filename}`;
        updateFields.push("avatar = ?");
        values.push(avatarPath);
    }

    if (req.files?.banner) {
        const bannerPath = `/uploads/banners/${req.files.banner[0].filename}`;
        updateFields.push("banner = ?");
        values.push(bannerPath);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: "No fields provided for update" });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err) => {
        if (err) {
            console.error("Error updating profile:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
        res.json({ message: "Profile updated successfully" });
    });
});

// Registration endpoint with email verification link
app.post('/register', async (req, res) => {
    const { email, password, name, role } = req.body;

    // Валидация
    if (!email || !password || !name || !role) {
        return res.status(400).json({ 
            success: false,
            message: "Все поля обязательны" 
        });
    }

    try {
        // Проверка существующего пользователя
        const [existingUser] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?", 
            [email.toLowerCase().trim()]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Пользователь уже существует"
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Генерация токена
        const emailToken = jwt.sign(
            { 
                id: userId,
                email: email.toLowerCase().trim() 
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '1d',
                algorithm: 'HS256'
            }
        );

        // Сохранение пользователя
        await db.promise().query(
            `INSERT INTO users SET ?`,
            {
                id: userId,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                name,
                role,
                is_verified: false,
                created_at: new Date()
            }
        );

        // Отправка письма
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${encodeURIComponent(emailToken)}`;
        
        const mailOptions = {
            from: `"FindFunds" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Подтверждение регистрации',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2563eb;">Подтвердите ваш email</h2>
                    <p>Для завершения регистрации нажмите кнопку:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                        Подтвердить Email
                    </a>
                    <p style="color: #666; margin-top: 20px;">
                        Если вы не регистрировались, проигнорируйте это письмо.
                    </p>
                </div>
            `,
            text: `Подтвердите email, перейдя по ссылке: ${verificationUrl}`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            success: true,
            message: "Письмо с подтверждением отправлено на ваш email",
            data: { userId }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: "Ошибка при регистрации",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify email endpoint
app.get('/verify-email', async (req, res) => {
    try {
        let token = req.query.token;
        
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Токен подтверждения отсутствует"
            });
        }

        // Декодируем токен
        token = decodeURIComponent(token).trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

        // Обновляем статус пользователя
        const [result] = await db.promise().query(
            `UPDATE users SET is_verified = TRUE 
             WHERE email = ? AND is_verified = FALSE`,
            [decoded.email.toLowerCase()]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Пользователь не найден или уже подтверждён"
            });
        }

        // Генерируем токен авторизации
        const authToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d', algorithm: 'HS256' }
        );

        // Определяем URL для редиректа
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/auth/verified?token=${authToken}`;
        
        console.log(`Redirecting to: ${redirectUrl}`); // Лог для отладки
        
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Email verification error:', error.message);
        
        let message = "Ошибка подтверждения email";
        if (error.name === 'TokenExpiredError') {
            message = "Срок действия ссылки истёк. Запросите новую.";
        } else if (error.name === 'JsonWebTokenError') {
            message = "Неверная ссылка подтверждения";
        }

        res.status(400).json({
            success: false,
            message
        });
    }
});

app.post('/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email обязателен"
        });
    }

    try {
        // Поиск пользователя
        const [user] = await db.promise().query(
            `SELECT id FROM users 
             WHERE email = ? AND is_verified = FALSE`,
            [email.toLowerCase().trim()]
        );

        if (!user.length) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден или уже подтверждён"
            });
        }

        // Генерация нового токена
        const newToken = jwt.sign(
            { id: user[0].id, email: email.toLowerCase().trim() },
            process.env.JWT_SECRET,
            { expiresIn: '1d', algorithm: 'HS256' }
        );

        // Отправка письма
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${encodeURIComponent(newToken)}`;
        
        const mailOptions = {
            from: `"FindFunds" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Подтверждение регистрации',
            html: `<a href="${verificationUrl}">Подтвердить email</a>`
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: "Письмо с подтверждением отправлено повторно"
        });

    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({
            success: false,
            message: "Ошибка сервера"
        });
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ error: 'Error logging in' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Email not verified' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ message: 'Login successful', token });
    });
});

// Маршрут для получения данных профиля
app.get('/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Проверяем токен
      const query = `SELECT id, email, name, role FROM users WHERE id = ?`;
  
      db.query(query, [decoded.id], (err, results) => {
        if (err) {
          console.error('Error fetching user profile:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        res.json(results[0]); // Отправляем данные профиля
      });
    } catch (error) {
      console.error('Invalid token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  });
  
// Новый эндпоинт для получения имени пользователя по user_id
app.get('/users/:user_id', (req, res) => {
    const userId = req.params.user_id;

    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(results[0]);
    });
});

// Example protected route
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'You have accessed a protected route', user: req.user });
});

app.get("/users/:userId", authMiddleware, (req, res) => {
    const { userId } = req.params;

    const sql = `SELECT id, name AS nickname, avatar FROM users WHERE id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        let user = result[0];

        // Проверяем, есть ли аватар
        if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
            user.avatar = `http://localhost:3000${user.avatar}`;
        } else {
            user.avatar = `http://localhost:3000/uploads/avatars/default-avatar.jpg`; // Заглушка
        }

        res.json(user);
    });
});

app.post('/videos', authenticateJWT, upload.fields([{ name: 'video' }, { name: 'preview' }]), async (req, res) => {
    if (!req.files || !req.files["video"] || !req.files["preview"]) {
        return res.status(400).json({ message: "Видео и превью обязательны" });
    }

    const { title, description, qualities } = req.body;
    const videoUrl = `/uploads/videos/${req.files["video"][0].filename}`;
    const previewUrl = `/uploads/previews/${req.files["preview"][0].filename}`;
    const videoId = uuidv4();

    // Сохраняем доступные качества
    const videoQualities = qualities ? JSON.parse(qualities) : [
        { quality: '1080p', url: videoUrl },
        { quality: '720p', url: videoUrl.replace('.mp4', '_720p.mp4') },
        { quality: '480p', url: videoUrl.replace('.mp4', '_480p.mp4') }
    ];

    const queryInsertVideo = `
        INSERT INTO videos (
            id, 
            title, 
            description, 
            url, 
            preview_url, 
            user_id,
            qualities
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(queryInsertVideo, [
        videoId,
        title,
        description,
        videoUrl,
        previewUrl,
        req.user.id,
        JSON.stringify(videoQualities)
    ], async (err, result) => {
        if (err) {
            console.error('Ошибка при загрузке видео:', err);
            return res.status(500).json({ error: 'Ошибка загрузки видео' });
        }

        await updateVideoIndex({
            id: videoId,
            title,
            description,
            preview_url: previewUrl,
            url: videoUrl,
            user_id: req.user.id,
            qualities: videoQualities
        });

        res.status(201).json({ 
            message: 'Видео успешно загружено', 
            videoId,
            qualities: videoQualities
        });
    });
});

app.get('/videos/:id/qualities', (req, res) => {
    const { id } = req.params;

    const query = `SELECT qualities FROM videos WHERE id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching video qualities:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const qualities = results[0].qualities ? JSON.parse(results[0].qualities) : [];
        res.json(qualities);
    });
});

app.get('/videos', (req, res) => {
    const query = 'SELECT * FROM videos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching videos:', err);
            return res.status(500).json({ error: 'Error fetching videos' });
        }
        res.json(results);
    });
});

app.get('/videos/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM videos WHERE id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching video by ID:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.json(results[0]);
    });
});

app.post('/videos/:videoId/view', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const { videoId } = req.params;

    // Получаем список просмотренных видео
    const getWatchedQuery = `SELECT watched_videos FROM users WHERE id = ?`;
    db.query(getWatchedQuery, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении списка просмотренных видео:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        let watchedVideos = results[0]?.watched_videos ? JSON.parse(results[0].watched_videos) : [];

        if (!watchedVideos.includes(videoId)) {
            watchedVideos.push(videoId);

            // Обновляем список просмотренных видео
            const updateWatchedQuery = `UPDATE users SET watched_videos = ? WHERE id = ?`;
            db.query(updateWatchedQuery, [JSON.stringify(watchedVideos), userId], (err) => {
                if (err) {
                    console.error('Ошибка при обновлении списка просмотренных видео:', err);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }

                // Увеличиваем количество просмотров видео
                const updateViewsQuery = `UPDATE videos SET views = views + 1 WHERE id = ?`;
                db.query(updateViewsQuery, [videoId], (updateErr) => {
                    if (updateErr) {
                        console.error('Ошибка при увеличении просмотров:', updateErr);
                        return res.status(500).json({ error: 'Ошибка сервера' });
                    }

                    res.json({ message: 'Просмотр добавлен' });
                });
            });
        } else {
            res.json({ message: 'Видео уже было просмотрено' });
        }
    });
});

app.get('/users/:userId/videos', (req, res) => {
    const { userId } = req.params;

    // Запрос теперь включает `preview_url`
    const query = `SELECT id, title, description, url, preview_url, views, likes, user_id FROM videos WHERE user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user videos:', err);
            return res.status(500).json({ error: 'Error fetching user videos' });
        }

        res.json(results);
    });
});

app.post('/comments/:videoId', authenticateJWT, (req, res) => {
    const { text, parent_id } = req.body;
    const { videoId } = req.params;

    if (!text || text.length > 500) {
        return res.status(400).json({ error: 'Invalid comment text' });
    }

    const commentId = uuidv4();
    const query = `INSERT INTO comments (id, text, author_id, video_id, parent_id) VALUES (?, ?, ?, ?, ?)`;

    db.query(query, [commentId, text, req.user.id, videoId, parent_id || null], (err) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ error: 'Error adding comment' });
        }

        res.status(201).json({ message: 'Comment added successfully', commentId });
    });
});

app.get('/comments/:videoId', (req, res) => {
    const { videoId } = req.params;

    const query = `SELECT * FROM comments WHERE video_id = ? ORDER BY likes DESC`;
    db.query(query, [videoId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ error: 'Error fetching comments' });
        }
        res.json(results);
    });
});

app.post('/comments/:commentId/like', authenticateJWT, (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Проверяем, лайкал ли уже пользователь этот комментарий
    const checkLikeQuery = `SELECT * FROM comment_likes WHERE user_id = ? AND comment_id = ?`;
    db.query(checkLikeQuery, [userId, commentId], (err, results) => {
        if (err) {
            console.error('Error checking like status:', err);
            return res.status(500).json({ error: 'Error checking like status' });
        }

        if (results.length > 0) {
            // Если лайк уже есть, удаляем его
            const removeLikeQuery = `DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?`;
            db.query(removeLikeQuery, [userId, commentId], (err) => {
                if (err) {
                    console.error('Error removing like:', err);
                    return res.status(500).json({ error: 'Error removing like' });
                }

                // Уменьшаем счётчик лайков в таблице `comments`
                const decrementLikeQuery = `UPDATE comments SET likes = likes - 1 WHERE id = ? AND likes > 0`;
                db.query(decrementLikeQuery, [commentId], (err) => {
                    if (err) {
                        console.error('Error decrementing like count:', err);
                        return res.status(500).json({ error: 'Error updating like count' });
                    }

                    res.json({ message: 'Like removed' });
                });
            });
        } else {
            // Если лайка нет, добавляем его
            const likeId = uuidv4();
            const addLikeQuery = `INSERT INTO comment_likes (id, user_id, comment_id) VALUES (?, ?, ?)`;
            db.query(addLikeQuery, [likeId, userId, commentId], (err) => {
                if (err) {
                    console.error('Error adding like:', err);
                    return res.status(500).json({ error: 'Error adding like' });
                }

                // Увеличиваем счётчик лайков в `comments`
                const incrementLikeQuery = `UPDATE comments SET likes = likes + 1 WHERE id = ?`;
                db.query(incrementLikeQuery, [commentId], (err) => {
                    if (err) {
                        console.error('Error incrementing like count:', err);
                        return res.status(500).json({ error: 'Error updating like count' });
                    }

                    res.json({ message: 'Like added' });
                });
            });
        }
    });
});


app.delete('/comments/:commentId', authenticateJWT, (req, res) => {
    const { commentId } = req.params;

    const query = `DELETE FROM comments WHERE id = ? AND (author_id = ? OR ? = 'admin')`;
    db.query(query, [commentId, req.user.id, req.user.role], (err) => {
        if (err) {
            console.error('Error deleting comment:', err);
            return res.status(500).json({ error: 'Error deleting comment' });
        }

        res.json({ message: 'Comment deleted successfully' });
    });
});

app.post('/startups/:startupId/offers', authenticateJWT, (req, res) => {
    const { startupId } = req.params;
    const { sharePercentage, offerAmount } = req.body;
    const userId = req.user.id;

    if (!sharePercentage || !offerAmount) {
        return res.status(400).json({ error: 'Share percentage and offer amount are required' });
    }

    // Проверяем, включены ли офферы для стартапа
    const checkOffersEnabledQuery = `SELECT offers_enabled FROM users WHERE id = ?`;
    db.query(checkOffersEnabledQuery, [startupId], (err, results) => {
        if (err) {
            console.error('Error checking offers_enabled:', err);
            return res.status(500).json({ error: 'Error checking offers status' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Startup not found' });
        }

        if (results[0].offers_enabled !== 1) {
            return res.status(403).json({ error: 'Offers are disabled for this startup' });
        }

        // Проверяем, существует ли уже оффер от данного инвестора для этого стартапа
        const checkOfferQuery = `SELECT id FROM offers WHERE investor_id = ? AND startup_id = ?`;
        db.query(checkOfferQuery, [userId, startupId], (err, results) => {
            if (err) {
                console.error('Error checking existing offer:', err);
                return res.status(500).json({ error: 'Error checking existing offer' });
            }

            if (results.length > 0) {
                // Если оффер уже существует, обновляем его
                const updateOfferQuery = `
                    UPDATE offers 
                    SET share_percentage = ?, offer_amount = ?, created_at = CURRENT_TIMESTAMP
                    WHERE id = ?`;
                db.query(updateOfferQuery, [sharePercentage, offerAmount, results[0].id], (err) => {
                    if (err) {
                        console.error('Error updating offer:', err);
                        return res.status(500).json({ error: 'Error updating offer' });
                    }
                    res.json({ message: 'Offer updated successfully' });
                });
            } else {
                // Если оффера нет, создаём новый (MySQL сам сгенерирует id, если AUTO_INCREMENT)
                const insertOfferQuery = `INSERT INTO offers (investor_id, startup_id, share_percentage, offer_amount) VALUES (?, ?, ?, ?)`;
                db.query(insertOfferQuery, [userId, startupId, sharePercentage, offerAmount], (err, result) => {
                    if (err) {
                        console.error('Error adding offer:', err);
                        return res.status(500).json({ error: 'Error adding offer' });
                    }
                    res.status(201).json({ message: 'Offer added successfully', offerId: result.insertId });
                });
            }
        });
    });
});

app.delete('/startups/:startupId/offers', authenticateJWT, (req, res) => {
    const { startupId } = req.params;
    const userId = req.user.id;

    

    // Проверяем, существует ли офер от этого инвестора для указанного стартапа
    const checkOfferQuery = `SELECT id FROM offers WHERE investor_id = ? AND startup_id = ?`;
    db.query(checkOfferQuery, [userId, startupId], (err, results) => {
        if (err) {
            console.error('Error checking offer:', err);
            return res.status(500).json({ error: 'Error checking offer' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No offer found for this startup' });
        }

        // Удаляем офер
        const deleteOfferQuery = `DELETE FROM offers WHERE investor_id = ? AND startup_id = ?`;
        db.query(deleteOfferQuery, [userId, startupId], (err) => {
            if (err) {
                console.error('Error deleting offer:', err);
                return res.status(500).json({ error: 'Error deleting offer' });
            }

            res.json({ message: 'Offer deleted successfully' });
        });
    });
});

app.get('/startups/:startupId/offers', (req, res) => {
    const { startupId } = req.params;

    const query = `
        SELECT o.id, u.id AS user_id, u.name AS investor_name, u.avatar, 
               o.share_percentage, o.offer_amount, o.created_at
        FROM offers o
        JOIN users u ON o.investor_id = u.id
        WHERE o.startup_id = ?
        ORDER BY o.created_at DESC
    `;

    db.query(query, [startupId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении оферов:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        res.json(results);
    });
});

app.post('/startups/:startupId/disable-offers', authenticateJWT, (req, res) => {
    const { startupId } = req.params;

    if (req.user.role !== 'startup' || req.user.id !== startupId) {
        return res.status(403).json({ error: 'Only the startup owner can disable offers.' });
    }

    const query = `UPDATE users SET offers_enabled = FALSE WHERE id = ?`;
    db.query(query, [startupId], (err) => {
        if (err) {
            console.error('Error disabling offers:', err);
            return res.status(500).json({ error: 'Error disabling offers' });
        }

        res.json({ message: 'Offers disabled successfully.' });
    });
});

app.post('/startups/:startupId/enable-offers', authenticateJWT, (req, res) => {
    const { startupId } = req.params;

    if (req.user.role !== 'startup' || req.user.id !== startupId) {
        return res.status(403).json({ error: 'Only the startup owner can enable offers.' });
    }

    const query = `UPDATE users SET offers_enabled = TRUE WHERE id = ?`;
    db.query(query, [startupId], (err) => {
        if (err) {
            console.error('Error enabling offers:', err);
            return res.status(500).json({ error: 'Error enabling offers' });
        }

        res.json({ message: 'Offers enabled successfully.' });
    });
});

app.delete('/videos/:videoId', authenticateJWT, (req, res) => {
    const { videoId } = req.params;

    const queryGetVideo = `SELECT url FROM videos WHERE id = ? AND user_id = ?`;
    db.query(queryGetVideo, [videoId, req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching video:', err);
            return res.status(500).json({ error: 'Error fetching video' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Video not found or access denied' });
        }

        const videoUrl = results[0].url;
        const filePath = `.${videoUrl}`;

        const queryDeleteVideo = `DELETE FROM videos WHERE id = ?`;
        db.query(queryDeleteVideo, [videoId], (err) => {
            if (err) {
                console.error('Error deleting video:', err);
                return res.status(500).json({ error: 'Error deleting video' });
            }

            // Remove video file from server
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting video file:', err);
                    return res.status(500).json({ error: 'Video entry deleted, but file removal failed' });
                }

                res.json({ message: 'Video deleted successfully' });
            });
        });
    });
});

app.post('/videos/:videoId/like', authenticateJWT, (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Проверяем, существует ли уже лайк
    const checkQuery = `SELECT * FROM video_likes WHERE user_id = ? AND video_id = ?`;
    db.query(checkQuery, [userId, videoId], (err, results) => {
        if (err) {
            console.error('Error checking like:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length > 0) {
            // Если лайк существует, удаляем его
            const deleteQuery = `DELETE FROM video_likes WHERE user_id = ? AND video_id = ?`;
            db.query(deleteQuery, [userId, videoId], (err) => {
                if (err) {
                    console.error('Error removing like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                // Уменьшаем счетчик лайков
                const updateQuery = `UPDATE videos SET likes = likes - 1 WHERE id = ?`;
                db.query(updateQuery, [videoId], (err) => {
                    if (err) {
                        console.error('Error updating like count:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.json({ message: 'Like removed' });
                });
            });
        } else {
            // Если лайка нет, добавляем его
            const insertQuery = `INSERT INTO video_likes (id, user_id, video_id) VALUES (?, ?, ?)`;
            db.query(insertQuery, [uuidv4(), userId, videoId], (err) => {
                if (err) {
                    console.error('Error adding like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                // Увеличиваем счетчик лайков
                const updateQuery = `UPDATE videos SET likes = likes + 1 WHERE id = ?`;
                db.query(updateQuery, [videoId], (err) => {
                    if (err) {
                        console.error('Error updating like count:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.json({ message: 'Like added' });
                });
            });
        }
    });
});

app.get('/api/videos/recommendations', authenticateJWT, (req, res) => {
    const userId = req.user.id; // Получаем userId из JWT

    if (!userId) {
        return res.status(400).json({ error: "Не удалось получить userId" });
    }

    // Получаем подписки и просмотренные видео пользователя
    const getUserDataQuery = `SELECT subscriptions, watched_videos FROM users WHERE id = ?`;

    db.query(getUserDataQuery, [userId], (err, userResults) => {
        if (err) {
            console.error('Ошибка получения данных пользователя:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        let { subscriptions, watched_videos } = userResults[0];

        subscriptions = subscriptions ? JSON.parse(subscriptions) : [];
        watched_videos = watched_videos ? JSON.parse(watched_videos) : [];

        console.log("User ID:", userId);
        console.log("Subscriptions:", subscriptions);
        console.log("Watched videos:", watched_videos);

        // Если `watched_videos` пустой, не используем `NOT IN ()`
        let query = `
            SELECT v.id, v.title, v.description, v.user_id, v.created_at, v.likes, v.views, v.preview_url,
                   (SELECT COUNT(*) FROM comments WHERE video_id = v.id) AS comment_count
            FROM videos v
        `;

        let queryParams = [];
        if (watched_videos.length > 0) {
            query += ` WHERE v.id NOT IN (${watched_videos.map(() => '?').join(',')}) `;
            queryParams.push(...watched_videos);
        }

        db.query(query, queryParams, (err, videoResults) => {
            if (err) {
                console.error('Ошибка получения видео:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            if (videoResults.length === 0) {
                return res.json({ message: 'Нет новых видео' });
            }

            console.log("Videos found:", videoResults.length);

            const calculateFreshness = (created_at) => {
                const daysAgo = (new Date() - new Date(created_at)) / (1000 * 60 * 60 * 24);
                return 1 / (1 + daysAgo);
            };

            videoResults.forEach(video => {
                let score =
                    (video.views * 0.4) +
                    (video.likes * 0.3) +
                    (video.comment_count * 0.15) +
                    (calculateFreshness(video.created_at) * 0.15);

                if (subscriptions.includes(video.user_id)) {
                    score *= 1.2;
                }

                video.score = score;
            });

            videoResults.sort((a, b) => b.score - a.score);
            res.json(videoResults.slice(0, 10));
        });
    });
});

app.post('/startups/:startupId/subscribe', authenticateJWT, (req, res) => {
    const investorId = req.user.id;
    const { startupId } = req.params;

    if (investorId === startupId) {
        return res.status(400).json({ error: 'Вы не можете подписаться на свой стартап' });
    }

    // Получаем текущий список подписок
    const getSubscriptionsQuery = `SELECT subscriptions FROM users WHERE id = ?`;
    db.query(getSubscriptionsQuery, [investorId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении подписок:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        let subscriptions = results[0]?.subscriptions ? JSON.parse(results[0].subscriptions) : [];

        if (subscriptions.includes(startupId)) {
            return res.status(400).json({ error: 'Вы уже подписаны на этот стартап' });
        }

        // Добавляем новый стартап в подписки
        subscriptions.push(startupId);
        const updateSubscriptionsQuery = `UPDATE users SET subscriptions = ? WHERE id = ?`;
        db.query(updateSubscriptionsQuery, [JSON.stringify(subscriptions), investorId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении подписок:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            // Увеличиваем счетчик подписчиков у стартапа
            const updateSubscribersQuery = `UPDATE users SET subscribers_count = subscribers_count + 1 WHERE id = ?`;
            db.query(updateSubscribersQuery, [startupId], (err) => {
                if (err) {
                    console.error('Ошибка при увеличении подписчиков:', err);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }

                res.status(201).json({ message: 'Вы успешно подписались на стартап' });
            });
        });
    });
});

app.delete('/startups/:startupId/unsubscribe', authenticateJWT, (req, res) => {
    const investorId = req.user.id;
    const { startupId } = req.params;

    const getSubscriptionsQuery = `SELECT subscriptions FROM users WHERE id = ?`;
    db.query(getSubscriptionsQuery, [investorId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении подписок:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        let subscriptions = results[0]?.subscriptions ? JSON.parse(results[0].subscriptions) : [];

        if (!subscriptions.includes(startupId)) {
            return res.status(400).json({ error: 'Вы не подписаны на этот стартап' });
        }

        // Удаляем стартап из подписок
        subscriptions = subscriptions.filter(id => id !== startupId);
        const updateSubscriptionsQuery = `UPDATE users SET subscriptions = ? WHERE id = ?`;
        db.query(updateSubscriptionsQuery, [JSON.stringify(subscriptions), investorId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении подписок:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            // Уменьшаем количество подписчиков у стартапа
            const updateSubscribersQuery = `UPDATE users SET subscribers_count = GREATEST(subscribers_count - 1, 0) WHERE id = ?`;
            db.query(updateSubscribersQuery, [startupId], (err) => {
                if (err) {
                    console.error('Ошибка при уменьшении подписчиков:', err);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }

                res.json({ message: 'Вы успешно отписались от стартапа' });
            });
        });
    });
});

app.get('/users/:userId/subscriptions', (req, res) => {
    const { userId } = req.params;

    const query = `SELECT subscriptions FROM users WHERE id = ?`;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении подписок:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        let subscriptions = results[0]?.subscriptions ? JSON.parse(results[0].subscriptions) : [];
        res.json({ subscriptions });
    });
});

app.get('/startups/:startupId/is-subscribed', authenticateJWT, (req, res) => {
    const investorId = req.user.id;
    const { startupId } = req.params;

    const query = `SELECT subscriptions FROM users WHERE id = ?`;
    db.query(query, [investorId], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке подписки:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        let subscriptions = results[0]?.subscriptions ? JSON.parse(results[0].subscriptions) : [];
        res.json({ isSubscribed: subscriptions.includes(startupId) });
    });
});

app.get('/api/videos/relevant', authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    try {
        // 1️⃣ Get the last 5 watched videos
        const query = `SELECT watched_videos FROM users WHERE id = ?`;
        const [userData] = await new Promise((resolve, reject) => {
            db.query(query, [userId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (!userData || !userData.watched_videos) {
            return res.status(404).json({ error: "No watched videos found" });
        }

        let watchedVideos = JSON.parse(userData.watched_videos) || [];
        watchedVideos = watchedVideos.slice(-5); // Get last 5 watched videos

        if (watchedVideos.length === 0) {
            return res.status(404).json({ error: "No recent history" });
        }

        // 2️⃣ Fetch details for the watched videos
        const placeholders = watchedVideos.map(() => "?").join(",");
        const videoQuery = `SELECT title, description FROM videos WHERE id IN (${placeholders})`;
        
        const watchedDetails = await new Promise((resolve, reject) => {
            db.query(videoQuery, watchedVideos, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!watchedDetails.length) {
            return res.status(404).json({ error: "Videos not found in DB" });
        }

        // 3️⃣ Extract keywords from titles, descriptions, and hashtags
        let searchQuery = watchedDetails.map(v => `${v.title} ${v.description}`).join(" ");

        console.log("🔍 Searching for:", searchQuery); // Debugging

        // 4️⃣ Search in MeiliSearch
        const searchResults = await videoIndex.search(searchQuery, {
            attributesToSearchOn: ["title", "description"]
        });

        // 5️⃣ Fetch full video details & authors
        const videos = await Promise.all(
            searchResults.hits.map(async (video) => {
                try {
                    const videoRes = await axios.get(`http://localhost:3000/videos/${video.id}`);
                    const videoData = videoRes.data;

                    const userRes = await axios.get(`http://localhost:3000/users/${videoData.user_id}`);
                    const userData = userRes.data;

                    return {
                        ...videoData,
                        author: userData.name,
                        avatar: userData.avatar
                    };
                } catch (error) {
                    console.error(`Error fetching video ${video.id}:`, error);
                    return null;
                }
            })
        );

        res.json(videos.filter(v => v !== null));

    } catch (error) {
        console.error('Error in relevant search:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/users/:userId/media', authenticateJWT, (req, res) => {
    const { userId } = req.params;
    const { title, type, url } = req.body;

    // Проверка обязательных полей
    if (!title || !type || !url) {
        return res.status(400).json({ error: "Title, type, and URL are required" });
    }

    // Проверка допустимых типов (добавлен 'figma')
    const allowedTypes = ["docs", "sheets", "figma"];
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ 
            error: `Invalid media type. Allowed types: ${allowedTypes.join(", ")}`
        });
    }

    // Дополнительная проверка URL для Figma
    if (type === "figma" && !url.startsWith("https://www.figma.com/")) {
        return res.status(400).json({ 
            error: "Figma URLs must start with https://www.figma.com/"
        });
    }

    const mediaId = uuidv4();
    const sql = `INSERT INTO media (id, user_id, title, type, url) VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [mediaId, userId, title, type, url], (err) => {
        if (err) {
            console.error("Error adding media:", err);
            return res.status(500).json({ 
                error: "Internal server error",
                details: err.message // Добавлена информация об ошибке для дебага
            });
        }

        res.status(201).json({ 
            message: "Media added successfully",
            mediaId,
            media: { id: mediaId, title, type, url } // Возвращаем созданный объект
        });
    });
});

app.get('/users/:userId/media', (req, res) => {
    const { userId } = req.params;

    const sql = `SELECT id, title, type, url, created_at FROM media WHERE user_id = ? ORDER BY created_at DESC`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching media:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        res.json(results);
    });
});

app.delete('/users/:userId/media/:mediaId', authenticateJWT, (req, res) => {
    const { userId, mediaId } = req.params;

    if (req.user.id !== userId) {
        return res.status(403).json({ error: "You can only delete your own media." });
    }

    const sql = `DELETE FROM media WHERE id = ? AND user_id = ?`;

    db.query(sql, [mediaId, userId], (err, result) => {
        if (err) {
            console.error("Error deleting media:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Media not found or already deleted." });
        }

        res.json({ message: "Media deleted successfully." });
    });
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q || '';

    try {
        // Ищем совпадения в MeiliSearch
        const videos = await videoIndex.search(query);
        const users = await userIndex.search(query);

        // Делаем запросы, чтобы получить полные данные по видео
        const videoDetails = await Promise.all(
            videos.hits.map(async (video) => {
                try {
                    const videoResponse = await axios.get(`http://localhost:3000/videos/${video.id}`);
                    const videoData = videoResponse.data;

                    // Запрашиваем данные об авторе видео
                    const authorResponse = await axios.get(`http://localhost:3000/users/${videoData.user_id}`);
                    const authorData = authorResponse.data;

                    return {
                        ...videoData,
                        author: authorData.name, // Добавляем имя автора
                        avatar: authorData.avatar // Добавляем аватар автора
                    };
                } catch (error) {
                    console.error(`Ошибка загрузки видео ${video.id}:`, error);
                    return null;
                }
            })
        );

        // Делаем запросы, чтобы получить полные данные по пользователям
        const userDetails = await Promise.all(
            users.hits.map(async (user) => {
                try {
                    const response = await axios.get(`http://localhost:3000/users/${user.id}`);
                    return response.data;
                } catch (error) {
                    console.error(`Ошибка загрузки пользователя ${user.id}:`, error);
                    return null;
                }
            })
        );

        // Фильтруем, чтобы убрать ошибки
        res.json({
            videos: videoDetails.filter(v => v !== null),
            users: userDetails.filter(u => u !== null)
        });
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Ошибка выполнения поиска' });
    }
});

// Создание поста с медиа
app.post('/posts', authenticateJWT, upload.array('media'), async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        const files = req.files;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        let mediaUrls = [];
        if (files && files.length > 0) {
            mediaUrls = files.map(file => `/uploads/media/${file.filename}`);
            console.log('Media URLs created:', mediaUrls);
        }

        const postId = uuidv4();
        const query = `
            INSERT INTO posts (
                id, 
                user_id, 
                content, 
                media_urls, 
                created_at,
                likes_count,
                reposts_count,
                replies_count
            ) VALUES (?, ?, ?, ?, NOW(), 0, 0, 0)
        `;
        
        // Сохраняем как строку, но без экранирования слешей
        const mediaUrlsJson = JSON.stringify(mediaUrls).replace(/\\\//g, '/');
        console.log('Saving media URLs:', mediaUrlsJson);

        db.query(query, [postId, userId, content, mediaUrlsJson], (err, result) => {
            if (err) {
                console.error('Error creating post:', err);
                return res.status(500).json({ error: 'Failed to create post' });
            }
            
            db.query(
                `SELECT p.*, u.name as author_name, u.avatar as author_avatar 
                 FROM posts p 
                 JOIN users u ON p.user_id = u.id 
                 WHERE p.id = ?`,
                [postId],
                (err, results) => {
                    if (err) {
                        console.error('Error fetching post:', err);
                        return res.status(500).json({ error: 'Failed to fetch created post' });
                    }

                    const post = results[0];
                    // Если media_urls это строка, парсим её
                    if (typeof post.media_urls === 'string') {
                        try {
                            post.media_urls = JSON.parse(post.media_urls);
                        } catch (e) {
                            console.error('Error parsing media_urls:', e);
                            post.media_urls = [];
                        }
                    } else if (!post.media_urls) {
                        post.media_urls = [];
                    }

                    res.status(201).json(post);
                }
            );
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление поста
app.delete('/posts/:postId', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Проверяем, существует ли пост и принадлежит ли он пользователю
        const [post] = await new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM posts WHERE id = ? AND user_id = ?',
                [postId, userId],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Удаляем медиафайлы поста, если они есть
        try {
            if (post.media_urls) {
                const mediaUrls = JSON.parse(post.media_urls);
                if (Array.isArray(mediaUrls)) {
                    mediaUrls.forEach(url => {
                        try {
                            const filePath = path.join(__dirname, url.replace(/^\//, ''));
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (e) {
                            console.error('Error deleting file:', e);
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error parsing media_urls:', e);
        }

        // Удаляем пост из базы данных
        await new Promise((resolve, reject) => {
            db.query(
                'DELETE FROM posts WHERE id = ?',
                [postId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Загрузка медиафайлов для поста
app.post('/upload/media', authenticateJWT, upload.array('files'), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        // Возвращаем полные URL'ы для файлов
        const urls = files.map(file => `http://localhost:3000/uploads/media/${file.filename}`);
        res.json({ urls });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавляем middleware для раздачи статических файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Добавьте этот код после других middleware, но до роутов
app.use('/uploads/media', express.static(path.join(__dirname, 'uploads/media')));

console.log("🔍 Зарегистрированные маршруты:");
app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(`${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});

// Получение постов пользователя
app.get('/users/:userId/posts', async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Простой запрос с правильной сортировкой и пагинацией
        const query = `
            SELECT 
                p.*,
                u.name as author_name,
                u.avatar as author_avatar,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [posts] = await db.promise().query(query, [userId, limit, offset]);
        
        const processedPosts = posts.map(post => {
            try {
                if (typeof post.media_urls === 'string') {
                    post.media_urls = JSON.parse(post.media_urls);
                } else if (!post.media_urls) {
                    post.media_urls = [];
                }
            } catch (e) {
                console.error('Error parsing media_urls:', e);
                post.media_urls = [];
            }
            return post;
        });

        // Добавим заголовок для кэширования
        res.set('Cache-Control', 'no-store');
        res.json(processedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET posts endpoint
app.get('/posts', authenticateJWT, (req, res) => {
    console.log('🔍 GET /posts request received');
    
    const query = `
        SELECT p.*, u.name as author_name, u.avatar as author_avatar 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching posts:', err);
            return res.status(500).json({ error: 'Failed to fetch posts' });
        }

        console.log('📦 Raw results from DB:', results);

        const posts = results.map(post => {
            console.log('\n🔎 Processing post:', post.id);
            console.log('📄 Raw media_urls:', post.media_urls);
            console.log('📝 Type of media_urls:', typeof post.media_urls);

            try {
                if (post.media_urls && post.media_urls !== 'null') {
                    post.media_urls = JSON.parse(post.media_urls);
                    console.log('✅ Successfully parsed media_urls:', post.media_urls);
                } else {
                    post.media_urls = [];
                    console.log('⚠️ Empty media_urls, setting to []');
                }
            } catch (e) {
                console.error('❌ Error parsing media_urls:', e);
                post.media_urls = [];
            }
            
            return post;
        });

        console.log('\n📤 Sending response with posts:', posts);
        res.json(posts);
    });
});

// Get single post
app.get('/posts/:postId', (req, res) => {
    const { postId } = req.params;

    const query = `SELECT * FROM posts WHERE id = ?`;
    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching post by ID:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(results[0]);
    });
});

// Лайк поста
app.post('/posts/:postId/like', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Проверяем, существует ли уже лайк
        const [existingLike] = await db.promise().query(
            'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // Если лайк существует - удаляем его
            await db.promise().query(
                'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
        } else {
            // Если лайка нет - добавляем его
            const likeId = uuidv4();
            await db.promise().query(
                'INSERT INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)',
                [likeId, postId, userId]
            );
        }

        // Получаем обновленное количество лайков
        const [likesResult] = await db.promise().query(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
            [postId]
        );

        const likesCount = likesResult[0].count;
        
        res.json({ 
            liked: !existingLike.length,
            likesCount: likesCount
        });

    } catch (error) {
        console.error('Error handling like:', error);
        res.status(500).json({ error: 'Failed to handle like' });
    }
});

// Проверка статуса лайка
app.get('/posts/:postId/like', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Проверяем статус лайка
        const [like] = await db.promise().query(
            'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        // Получаем общее количество лайков
        const [likesResult] = await db.promise().query(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
            [postId]
        );

        res.json({
            liked: like.length > 0,
            likesCount: likesResult[0].count
        });
    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({ error: 'Failed to check like status' });
    }
});

// Получение комментариев к посту
app.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;

    const query = `
        SELECT 
            c.*,
            u.name as author_name,
            u.avatar as author_avatar
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
    `;

    try {
        const [comments] = await db.promise().query(query, [postId]);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Добавление комментария
app.post('/posts/:postId/comments', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    const commentId = uuidv4();

    try {
        await db.promise().query(
            'INSERT INTO post_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)',
            [commentId, postId, userId, content.trim()]
        );

        const [[comment]] = await db.promise().query(
            `SELECT 
                c.*,
                u.name as author_name,
                u.avatar as author_avatar
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?`,
            [commentId]
        );

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Удаление комментария
app.delete('/posts/:postId/comments/:commentId', authenticateJWT, async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    try {
        // Проверяем, существует ли комментарий и принадлежит ли он пользователю
        const [[comment]] = await db.promise().query(
            'SELECT * FROM post_comments WHERE id = ? AND post_id = ?',
            [commentId, postId]
        );

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await db.promise().query(
            'DELETE FROM post_comments WHERE id = ?',
            [commentId]
        );

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});


// Эндпоинт для получения лайкнутых видео
app.get('/liked-videos', authenticateJWT, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT v.* 
        FROM videos v 
        JOIN video_likes vl ON v.id = vl.video_id 
        WHERE vl.user_id = ?
        ORDER BY v.created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching liked videos:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(results);
    });
});

// Эндпоинт для удаления лайка
app.delete('/videos/:videoId/like', authenticateJWT, (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    const query = `
        DELETE FROM video_likes 
        WHERE user_id = ? AND video_id = ?
    `;

    db.query(query, [userId, videoId], (err) => {
        if (err) {
            console.error('Error unliking video:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ message: 'Video unliked successfully' });
    });
});

// Эндпоинт для проверки, лайкнуто ли видео
app.get('/videos/:videoId/like', authenticateJWT, (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    const query = `
        SELECT id FROM video_likes 
        WHERE user_id = ? AND video_id = ?
    `;

    db.query(query, [userId, videoId], (err, results) => {
        if (err) {
            console.error('Error checking like status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ isLiked: results.length > 0 });
    });
});

// Эндпоинт для получения всех офферов, которые сделал пользователь
app.get('/my-offers', authenticateJWT, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT o.*, u.name as startup_name 
        FROM offers o
        JOIN users u ON o.startup_id = u.id
        WHERE o.investor_id = ?
        ORDER BY o.created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching offers:', err);
            return res.status(500).json({ error: 'Error fetching offers' });
        }

        res.json(results);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


