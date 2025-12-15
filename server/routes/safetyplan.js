const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

// GET /api/safetyplan?userId=... - Get user's safety plan
router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM safety_plans WHERE userId = ?',
            [userId]
        );

        if (rows[0]) {
            // Parse JSON fields
            const plan = rows[0];
            if (plan.supportContacts && typeof plan.supportContacts === 'string') {
                plan.supportContacts = JSON.parse(plan.supportContacts);
            }
            if (plan.professionalContacts && typeof plan.professionalContacts === 'string') {
                plan.professionalContacts = JSON.parse(plan.professionalContacts);
            }
            res.json(plan);
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error("Error fetching safety plan:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/safetyplan - Create or update safety plan
router.post('/', async (req, res) => {
    const {
        userId,
        warningSignals,
        copingStrategies,
        reasonsToLive,
        supportContacts,
        safeEnvironmentSteps,
        professionalContacts
    } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // Use REPLACE to upsert (since userId is unique)
        await pool.execute(
            `REPLACE INTO safety_plans 
            (userId, warningSignals, copingStrategies, reasonsToLive, supportContacts, safeEnvironmentSteps, professionalContacts, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                warningSignals || null,
                copingStrategies || null,
                reasonsToLive || null,
                JSON.stringify(supportContacts || []),
                safeEnvironmentSteps || null,
                JSON.stringify(professionalContacts || []),
                new Date()
            ]
        );
        res.status(201).json({ message: "Safety plan saved" });
    } catch (err) {
        console.error("Error saving safety plan:", err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            return res.status(401).json({ error: "User mismatch. Please login again." });
        }
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
