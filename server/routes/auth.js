const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { createUser, findUserByEmail, findUserById } = require('../utils/db');

// Auth: Signup
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const newUser = {
            id: uuidv4(),
            fullName,
            email,
            password,
            joinedDate: new Date()
        };

        await createUser(newUser);

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ message: "User registered", user: userWithoutPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Auth: Anonymous
router.post('/anonymous', async (req, res) => {
    const { nickname } = req.body;

    try {
        const newUser = {
            id: uuidv4(),
            fullName: nickname || "Anonymous",
            joinedDate: new Date(),
            isAnonymous: true
        };

        await createUser(newUser);
        res.status(201).json({ message: "Anonymous session started", user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Auth: Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: "Login successful", user: userWithoutPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
