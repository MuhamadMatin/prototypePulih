const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createJournalEntry, getJournalEntries } = require('../utils/db');
require('dotenv').config();

const INFERENCE_URL = process.env.INFERENCE_URL;
const INFERENCE_KEY = process.env.INFERENCE_KEY;
const INFERENCE_MODEL_ID = process.env.INFERENCE_MODEL_ID;

// PUT /api/journal/:id - Update journal
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ error: "UserId and Content required" });
    }

    try {
        // In real app, check ownership here.
        // Assuming ownership check passes or simplified for now.

        // Re-analyze on update? Let's say yes for now to keep insight fresh.
        const messages = [
            { role: "system", content: "You are an empathetic psychologist assistant. Read the user's updated journal entry and provide a brief, supportive, and psychologically grounded insight (max 2-3 sentences). Focus on validation and a gentle path forward. Use Indonesian language." },
            { role: "user", content: content }
        ];

        let aiFeedback = "Jurnal diperbarui.";
        try {
            const response = await axios.post(`${INFERENCE_URL}/v1/chat/completions`, {
                model: INFERENCE_MODEL_ID,
                messages: messages,
                temperature: 0.7,
                max_tokens: 300
            }, {
                headers: {
                    'Authorization': `Bearer ${INFERENCE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            aiFeedback = response.data.choices[0]?.message?.content || aiFeedback;
        } catch (aiErr) {
            console.error("AI Analysis failed:", aiErr.message);
        }

        const { updateJournalEntry } = require('../utils/db');
        const entry = await updateJournalEntry(id, content, aiFeedback);
        res.json({ message: "Journal updated", entry });
    } catch (err) {
        console.error("Error updating journal:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/journal - Save journal (no analysis)
router.post('/', async (req, res) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ error: "UserId and Content are required" });
    }

    try {
        const entry = await createJournalEntry(userId, content, null);
        res.status(201).json({ message: "Journal saved", entry });
    } catch (err) {
        console.error("Error saving journal:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST /api/journal/analyze - Analyze and Save
router.post('/analyze', async (req, res) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ error: "UserId and Content are required" });
    }

    try {
        // 1. Call AI for insight
        const messages = [
            { role: "system", content: "You are an empathetic psychologist assistant. Read the user's journal entry and provide a brief, supportive, and psychologically grounded insight (max 2-3 sentences). Focus on validation and a gentle path forward. Use Indonesian language." },
            { role: "user", content: content }
        ];

        let aiFeedback = "Terima kasih telah berbagi cerita.";
        try {
            const response = await axios.post(`${INFERENCE_URL}/v1/chat/completions`, {
                model: INFERENCE_MODEL_ID,
                messages: messages,
                temperature: 0.7,
                max_tokens: 300
            }, {
                headers: {
                    'Authorization': `Bearer ${INFERENCE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            aiFeedback = response.data.choices[0]?.message?.content || aiFeedback;
        } catch (aiErr) {
            console.error("AI Analysis failed:", aiErr.message);
            // Fallback is default message
        }

        // 2. Save to DB
        const entry = await createJournalEntry(userId, content, aiFeedback);

        res.status(201).json({ message: "Journal analyzed and saved", entry });

    } catch (err) {
        console.error("Error processing journal:", err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            return res.status(401).json({ error: "User mismatch. Please login again." });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// GET /api/journal/history
router.get('/history', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserId required" });

    try {
        const entries = await getJournalEntries(userId);
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
