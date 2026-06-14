const express = require('express');
const router = express.Router();
const { MeiliSearch } = require('meilisearch');

// Подключение к MeiliSearch
const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'supersecretkey'
});

const videoIndex = client.index('videos');
const userIndex = client.index('users');

router.get('/', async (req, res) => {
    const query = req.query.q || '';
    
    try {
        const videos = await videoIndex.search(query);
        const users = await userIndex.search(query);
        res.json({ videos: videos.hits, users: users.hits });
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

module.exports = router;