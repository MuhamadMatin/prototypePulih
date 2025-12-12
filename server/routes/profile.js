const express = require('express');
const router = express.Router();
const { updateUser, findUserById } = require('../utils/db');

// Profile Update
router.post('/update', async (req, res) => {
    const { id, fullName, nickname, email, phone, bio, isAnonymous } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required" });

    try {
        const user = await findUserById(id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update fields
        const updatedUser = await updateUser(id, { fullName, nickname, email, phone, bio, isAnonymous });

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ user: userWithoutPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
