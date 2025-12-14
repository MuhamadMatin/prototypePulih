const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createChat, updateChat, getChatsByUserId, getChatById, getDataContext } = require('../utils/db');
const SYSTEM_PROMPT = require('../utils/systemPrompt');

require('dotenv').config();

// Config from env
const INFERENCE_URL = process.env.INFERENCE_URL;
const INFERENCE_KEY = process.env.INFERENCE_KEY;
const INFERENCE_MODEL_ID = process.env.INFERENCE_MODEL_ID;

// Chat History: Get
router.get('/history', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
        const userChats = await getChatsByUserId(userId);
        res.json(userChats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Chat History: Save Session (Create or Update)
router.post('/session', async (req, res) => {
    const { userId, sessionId, title, messages } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
        let session;
        if (sessionId) {
            session = await getChatById(sessionId);
        }

        if (!session) {
            session = {
                id: sessionId || Date.now().toString(), // Ideally use UUID, but keeping logic consistent
                userId,
                title: title || "Sesi Baru",
                createdAt: new Date(),
                messages: messages || []
            };
            await createChat(session);
        } else {
            await updateChat(sessionId, { title, messages });
            session = await getChatById(sessionId); // Fetch updated
        }

        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Crisis Detection
const CRISIS_KEYWORDS = [
    "bunuh diri", "ingin mati", "akhiri hidup", "lukai diri", "tidak kuat lagi", "gantung diri", "minum racun", "lompat dari", "iris nadi", "potong nadi"
];

function checkCrisis(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some(k => lower.includes(k));
}

// Chat Completion
router.post('/', async (req, res) => {
    const { message, history, userId, sessionId } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Determine System Prompt based on Crisis Detection
    const isCrisis = checkCrisis(message);
    const selectedSystemPrompt = isCrisis ? CRISIS_SYSTEM_PROMPT : NORMAL_SYSTEM_PROMPT;

    // Fetch Context (Mood/Journal) if userId is present
    let contextStr = "";
    if (userId) {
        try {
            const contextData = await getDataContext(userId);
            if (contextData) {
                const { mood, journal } = contextData;
                contextStr += "\n\n[CONTEXT DATA (Use this to personalize response)]\n";
                if (mood) {
                    contextStr += `- Latest Mood(${new Date(mood.createdAt).toLocaleDateString()}): Level ${mood.moodLevel}/5. Note: "${mood.note || ''}"\n`;
                }
                if (journal) {
                    contextStr += `- Latest Journal (${new Date(journal.createdAt).toLocaleDateString()}): "${journal.content.substring(0, 300)}..."\n`;
                }
            }
        } catch (err) { console.error("Error fetching context:", err); }
    }

    const messages = [
        { role: "system", content: selectedSystemPrompt + contextStr },
        ...(history || []),
        { role: "user", content: message }
    ];

    const payload = {
        model: INFERENCE_MODEL_ID,
        messages: messages,
        temperature: isCrisis ? 0.3 : 0.7, // Lower temperature for crisis to be more focused/grounded
        max_tokens: 4096,
        stream: true
    };

    try {
        const response = await axios.post(`${INFERENCE_URL} /v1/chat / completions`, payload, {
            headers: {
                'Authorization': `Bearer ${INFERENCE_KEY} `,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.data.on('data', chunk => {
            res.write(chunk);
        });

        response.data.on('end', () => {
            res.end();
        });

    } catch (error) {
        console.error("Error generating chat completion:", error.message);
        res.write(`event: error\ndata: { "error": "Internal Server Error" } \n\n`);
        res.end();
    }
});

// Session Summary endpoint
router.post('/summary', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });

    try {
        const session = await getChatById(sessionId);
        if (!session || !session.messages) return res.status(404).json({ error: "Session not found" });

        const messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
        const transcript = messages.map(m => `${m.role}: ${m.content} `).join('\n');

        const prompt = [
            { role: "system", content: "You are a psychologist. Summarize the following counseling session in 3-5 bullet points in Indonesian. Focus on the user's main concerns and emotional state." },
            { role: "user", content: transcript }
        ];

        const response = await axios.post(`${INFERENCE_URL} /v1/chat / completions`, {
            model: INFERENCE_MODEL_ID,
            messages: prompt,
            temperature: 0.5,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${INFERENCE_KEY} `,
                'Content-Type': 'application/json'
            }
        });

        const summary = response.data.choices[0]?.message?.content || "Tidak ada ringkasan.";
        res.json({ summary });

    } catch (err) {
        console.error("Error generating summary:", err);
        res.status(500).json({ error: "Summary generation failed" });
    }
});

// Chat Suggestion
router.post('/suggest', async (req, res) => {
    const { history } = req.body;

    const historyText = (history || [])
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'User' : 'Counselor'}: ${m.content} `)
        .join('\n');

    const suggestionMessages = [
        { role: "system", content: "You are an assistant generating 3 possible responses for a User (counseling client) to say to their AI Counselor. The suggestions must be in the first person ('Aku'/'Saya'). They should be natural responses to the Counselor's last message, such as answering a question, expressing a feeling, or asking for specific advice. Do NOT generate questions that a counselor would ask (like 'Sudah berapa lama?'). Output ONLY a raw JSON array of strings. Example: [\"Aku merasa sedih.\", \"Apa yang harus aku lakukan?\", \"Aku tidak yakin.\"]." },
        { role: "user", content: `Here is the recent conversation context: \n\n${historyText} \n\nBased on this interaction, suggest 3 relevant responses for the USER to say next in Indonesian.` }
    ];

    const payload = {
        model: INFERENCE_MODEL_ID,
        messages: suggestionMessages,
        temperature: 0.7,
        max_tokens: 256
    };

    try {
        const response = await axios.post(`${INFERENCE_URL} /v1/chat / completions`, payload, {
            headers: {
                'Authorization': `Bearer ${INFERENCE_KEY} `,
                'Content-Type': 'application/json'
            }
        });

        let content = response.data.choices[0]?.message?.content || "[]";

        try {
            const firstBracket = content.indexOf('[');
            const lastBracket = content.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                content = content.substring(firstBracket, lastBracket + 1);
            }
            const suggestions = JSON.parse(content);
            res.json({ suggestions });
        } catch (e) {
            console.error("Failed to parse suggestions JSON");
            res.json({ suggestions: [] });
        }

    } catch (error) {
        console.error("Error generating suggestions:", error.message);
        res.json({ suggestions: [] });
    }
});

module.exports = router;
