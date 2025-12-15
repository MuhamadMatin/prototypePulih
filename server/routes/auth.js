const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { createUser, findUserByEmail, findUserByUsername, findUserById } = require('../utils/db');

// Auth: Signup (Regular)
router.post('/signup', async (req, res) => {
    const { fullName, email, password, username } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // If username provided, check it (optional for regular signup if not enforced, but let's enforce or auto-generate)
        // For now, regular signup might not expose username field in UI yet, but let's support it if sent.

        let finalUsername = username;
        if (finalUsername) {
            const existingUser = await findUserByUsername(finalUsername);
            if (existingUser) return res.status(400).json({ error: "Username taken" });
        }

        const newUser = {
            id: uuidv4(),
            fullName,
            email,
            username: finalUsername,
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

// Auth: Anonymous (Now Username + Password)
router.post('/anonymous', async (req, res) => {
    const { nickname, username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and Password are required for anonymous account recovery." });
    }

    try {
        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            // Suggestion logic
            const suggestion = `${username}${Math.floor(Math.random() * 1000)}`;
            return res.status(409).json({
                error: "Username taken",
                suggestion: suggestion
            });
        }

        const newUser = {
            id: uuidv4(),
            fullName: nickname || "Anonymous",
            username,
            password,
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
    const { email, username, password } = req.body;
    let identifier = email;

    // Frontend might send 'email' field but with a username in it, or explicit username field.
    // Let's handle generic 'identifier' if 'email' is used for both. 
    // Usually standard forms use 'email' input name. If we change UI to 'username', we might send { username: ... }

    // We will assume 'email' param can hold username too, or check for username param.
    const userIdentifier = email || username;

    if (!userIdentifier || !password) {
        return res.status(400).json({ error: "Username/Email and Password are required" });
    }

    try {
        let user = await findUserByEmail(userIdentifier);
        if (!user) {
            user = await findUserByUsername(userIdentifier);
        }

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
