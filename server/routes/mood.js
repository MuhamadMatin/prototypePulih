const express = require('express');
const router = express.Router();
const { createMoodLog, getMoodHistory } = require('../utils/db');

// POST /api/mood - Save mood
router.post('/', async (req, res) => {
    const { userId, moodLevel, note } = req.body;

    if (!userId || !moodLevel) {
        return res.status(400).json({ error: "UserId and MoodLevel are required" });
    }

    try {
        await createMoodLog(userId, moodLevel, note);
        res.status(201).json({ message: "Mood saved" });
    } catch (err) {
        console.error("Error saving mood:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/mood/history?userId=... - Get history
router.get('/history', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "UserId is required" });
    }

    try {
        const history = await getMoodHistory(userId);
        res.json(history);
    } catch (err) {
        console.error("Error fetching mood history:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
