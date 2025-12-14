const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

// POST /api/assessment - Save assessment result
router.post('/', async (req, res) => {
    const { userId, type, score, severity, answers } = req.body;

    if (!userId || !type || score === undefined) {
        return res.status(400).json({ error: "userId, type, and score are required" });
    }

    try {
        await pool.execute(
            'INSERT INTO assessments (userId, type, score, severity, answers, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, score, severity || null, JSON.stringify(answers || []), new Date()]
        );
        res.status(201).json({ message: "Assessment saved" });
    } catch (err) {
        console.error("Error saving assessment:", err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            return res.status(401).json({ error: "User mismatch. Please login again." });
        }
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/assessment/history?userId=... - Get assessment history
router.get('/history', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM assessments WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching assessment history:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/assessment/latest?userId=...&type=... - Get latest assessment of a type
router.get('/latest', async (req, res) => {
    const { userId, type } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        let query = 'SELECT * FROM assessments WHERE userId = ?';
        const params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY createdAt DESC LIMIT 1';

        const [rows] = await pool.execute(query, params);
        res.json(rows[0] || null);
    } catch (err) {
        console.error("Error fetching latest assessment:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
