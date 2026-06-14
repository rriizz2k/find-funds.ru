# Find-Funds — платформа для питча стартапов инвесторам

Find-Funds — это веб-платформа, где стартапы публикуют видео-питчи, а инвесторы находят, оценивают их и делают инвестиционные предложения прямо на сайте. Сервис объединяет предпринимателей и инвесторов в одном пространстве: с лентой, подписками, поиском и системой офферов.

## Стек

**Backend**
- Node.js + Express
- MySQL 2 — основная БД
- MeiliSearch — полнотекстовый поиск по видео и пользователям
- JWT — авторизация
- Nodemailer — отправка писем (подтверждение email)
- Multer — загрузка файлов (видео, аватары, баннеры)
- bcrypt — хеширование паролей

**Frontend**
- React 19 + Vite 6
- React Router DOM 7
- Material UI (MUI) 6 + Emotion
- Tailwind CSS 4
- react-hot-toast

## Как запустить локально

### Требования
- Node.js 18+
- MySQL 8+
- MeiliSearch (опционально, для поиска)

### 1. Клонировать репозиторий

```bash
git clone https://github.com/rriizz2k/find-funds.git
cd find-funds
```

### 2. Настроить бэкенд

```bash
cd sponsorfy-backend
npm install
cp .env.example .env
# Заполнить .env своими данными (БД, email, JWT secret)
```

### 3. Создать БД

```bash
mysql -u root -p
CREATE DATABASE sponsorfy;
CREATE USER 'sponsorfy_user'@'localhost' IDENTIFIED BY 'ваш_пароль';
GRANT ALL ON sponsorfy.* TO 'sponsorfy_user'@'localhost';
```

Импортируйте схему (если есть `schema.sql`):
```bash
mysql -u sponsorfy_user -p sponsorfy < ../schema.sql
```

### 4. Запустить MeiliSearch (опционально)

```bash
# macOS
brew install meilisearch
meilisearch --master-key="ваш_ключ"
```

### 5. Запустить бэкенд

```bash
cd sponsorfy-backend
node index.js
# Сервер запустится на http://localhost:3000
```

### 6. Настроить и запустить фронтенд

```bash
cd sponsorfy-frontend
npm install
npm run dev
# Откроется на http://localhost:5173
```

## Структура проекта

```
find-funds/
├── sponsorfy-backend/       # Node.js/Express API
│   ├── index.js             # Точка входа, все эндпоинты
│   ├── routes/
│   │   └── search.js        # Роуты поиска
│   ├── uploads/             # Загруженные файлы (видео, аватары, превью)
│   ├── .env.example         # Шаблон переменных окружения
│   └── package.json
│
├── sponsorfy-frontend/      # React + Vite фронтенд
│   ├── src/
│   │   ├── App.jsx          # Роутинг
│   │   ├── pages/           # Страницы (Home, Profile, VideoPage, Search...)
│   │   └── components/      # Компоненты (Navbar, VideoCard, Comments...)
│   ├── public/              # Статика
│   └── package.json
│
├── schema.sql               # SQL-схема базы данных
└── README.md
```

## API (основные эндпоинты)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация |
| POST | `/login` | Авторизация |
| GET | `/videos` | Список всех видео |
| POST | `/videos` | Загрузить видео-питч |
| GET | `/users/:id` | Профиль пользователя |
| POST | `/startups/:id/offers` | Сделать инвест-оффер |
| POST | `/startups/:id/subscribe` | Подписаться на стартап |
| GET | `/api/search?q=` | Поиск по видео и пользователям |

## Скриншоты

### Домашняя страница

<img width="1486" height="1198" alt="image" src="https://github.com/user-attachments/assets/b4633242-f47a-4784-b898-070c7967b3dc" />

### Видео страница

<img width="1735" height="1324" alt="image" src="https://github.com/user-attachments/assets/0f040b2a-2f06-4e71-9a2c-db44b291f179" />

### Профиль

<img width="1758" height="1333" alt="image" src="https://github.com/user-attachments/assets/f1c8b905-f224-4c04-aa80-674489e681fb" />


## Команда и вклад

**Руслан · [@mirzoevXO](https://t.me/mirzoevXO)** — Full-stack разработка платформы: реализовал REST API на Node.js/Express, настроил JWT-based authentication flow, работу с MySQL-моделями и основными CRUD-сценариями для пользователей, видео-питчей, профилей, подписок и инвестиционных офферов. Также собрал media upload pipeline через Multer, интегрировал backend с React/Vite frontend, настроил routing, страницы и компоненты для ключевых user flows: регистрация, авторизация, просмотр питчей, профиль стартапа, поиск и отправка офферов.

**Рустам · [@rustamgasymov](https://github.com/rustamgasymov)** — Финансовая модель и DevOps: проработка экономики проекта, сценариев монетизации, а также настройка окружения, запуск сервисов и поддержка инфраструктурной части.
