const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

// POST /api/grounding/complete - Log completed grounding session
router.post('/complete', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        await pool.execute(
            'INSERT INTO grounding_sessions (userId, completedAt) VALUES (?, ?)',
            [userId, new Date()]
        );
        res.status(201).json({ message: "Grounding session logged" });
    } catch (err) {
        console.error("Error logging grounding session:", err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            return res.status(401).json({ error: "User mismatch. Please login again." });
        }
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/grounding/count?userId=... - Get grounding session count
router.get('/count', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM grounding_sessions WHERE userId = ?',
            [userId]
        );
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error("Error fetching grounding count:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
