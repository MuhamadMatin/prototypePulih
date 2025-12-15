const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

// GET /api/achievements?userId=... - Get user achievements
router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM achievements WHERE userId = ? ORDER BY unlockedAt DESC',
            [userId]
        );
        res.json({ achievements: rows });
    } catch (err) {
        console.error("Error fetching achievements:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/achievements - Unlock an achievement
router.post('/', async (req, res) => {
    const { userId, achievementType } = req.body;

    if (!userId || !achievementType) {
        return res.status(400).json({ error: "userId and achievementType are required" });
    }

    try {
        // Use INSERT IGNORE to prevent duplicates
        await pool.execute(
            'INSERT IGNORE INTO achievements (userId, achievementType, unlockedAt) VALUES (?, ?, ?)',
            [userId, achievementType, new Date()]
        );
        res.status(201).json({ message: "Achievement unlocked" });
    } catch (err) {
        console.error("Error unlocking achievement:", err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            return res.status(401).json({ error: "User mismatch. Please login again." });
        }
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/achievements/check - Check and unlock multiple achievements
router.post('/check', async (req, res) => {
    const { userId, triggerType, count } = req.body;

    if (!userId || !triggerType) {
        return res.status(400).json({ error: "userId and triggerType are required" });
    }

    // This would ideally use the achievements config
    // For now, just return success
    res.json({ checked: true, triggerType, count });
});

module.exports = router;
