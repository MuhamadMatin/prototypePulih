const express = require('express');
const router = express.Router();
const { updateUserStreak } = require('../utils/db');

const AFFIRMATIONS = [
    "Kamu berharga dan pantas dicintai.",
    "Setiap langkah kecil adalah kemajuan.",
    "Hari ini adalah kesempatan baru untuk memulai.",
    "Tidak apa-apa untuk beristirahat.",
    "Perasaanmu valid.",
    "Kamu lebih kuat dari yang kamu kira.",
    "Bernafaslah, semuanya akan baik-baik saja.",
    "Kamu tidak sendirian dalam perjuangan ini."
];

// GET /api/utils/affirmation
router.get('/affirmation', (req, res) => {
    const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    res.json({ text: random });
});

// GET /api/utils/streak?userId=...
router.get('/streak', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserId required" });

    try {
        const streak = await updateUserStreak(userId); // Updates logic if needed, or just returns current
        // Since updateUserStreak actually updates, we might want a separate read-only? 
        // But for this feature, "Get Streak" usually implies "Check my status", so updating lastLogin logic here is fine for "Daily check-in".
        // Actually, normally you call update on login. But let's assume visiting the dashboard updates it too.
        res.json({ streak });
    } catch (err) {
        console.error("Error fetching streak:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
