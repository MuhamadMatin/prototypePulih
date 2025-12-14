const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
// Heroku JawsDB provides JAWSDB_URL, otherwise use local credentials
const pool = mysql.createPool(process.env.JAWSDB_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pisikologchatbot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize DB tables
async function initDB() {
    try {
        const connection = await pool.getConnection();
        const schema = require('fs').readFileSync(require('path').join(__dirname, '../config/schema.sql'), 'utf8');
        const statements = schema.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }
        connection.release();
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// User Operations
async function createUser(user) {
    const { id, fullName, email, password, nickname, joinedDate } = user;
    const [result] = await pool.execute(
        'INSERT INTO users (id, fullName, email, password, nickname, joinedDate, isAnonymous) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, fullName, email || null, password || null, nickname || null, joinedDate, user.isAnonymous ? 1 : 0]
    );
    return result;
}

async function findUserByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

async function findUserById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
}

async function updateUser(id, data) {
    const fields = [];
    const values = [];

    // Helper to add field if exists
    const addField = (key, val) => {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    };

    addField('fullName', data.fullName);
    addField('nickname', data.nickname);
    addField('email', data.email);
    addField('phone', data.phone);
    addField('bio', data.bio);
    if (data.isAnonymous !== undefined) addField('isAnonymous', data.isAnonymous ? 1 : 0);

    if (fields.length === 0) return null;

    values.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return findUserById(id);
}

// Chat Operations
async function createChat(chat) {
    const { id, userId, title, createdAt, messages } = chat;
    const messagesJson = JSON.stringify(messages || []);
    await pool.execute(
        'INSERT INTO chats (id, userId, title, createdAt, updatedAt, messages) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, title || 'Sesi Baru', createdAt, new Date(), messagesJson]
    );
    return chat;
}

async function updateChat(id, data) {
    const fields = [];
    const values = [];

    if (data.title) {
        fields.push('title = ?');
        values.push(data.title);
    }
    if (data.messages) {
        fields.push('messages = ?');
        values.push(JSON.stringify(data.messages));
    }

    // Always update updatedAt
    fields.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);
    await pool.execute(`UPDATE chats SET ${fields.join(', ')} WHERE id = ?`, values);

    return getChatById(id);
}

async function getChatsByUserId(userId) {
    const [rows] = await pool.execute('SELECT * FROM chats WHERE userId = ? ORDER BY updatedAt DESC', [userId]);
    // Parse JSON messages
    return rows.map(row => ({
        ...row,
        messages: row.messages // mysql2 usually parses JSON automatically for JSON columns, but if not, JSON.parse may be needed based on driver version/config. For now assuming newer MySQL/MariaDB.
    }));
}

async function getChatById(id) {
    const [rows] = await pool.execute('SELECT * FROM chats WHERE id = ?', [id]);
    if (!rows[0]) return null;
    return rows[0];
}

// Context for Chat
async function getDataContext(userId) {
    if (!userId) return null;

    // Get latest mood
    const [moods] = await pool.execute(
        'SELECT * FROM mood_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
        [userId]
    );

    // Get latest journal
    const [journals] = await pool.execute(
        'SELECT * FROM journal_entries WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
        [userId]
    );

    return {
        mood: moods[0] || null,
        journal: journals[0] || null
    };
}

module.exports = {
    pool,
    initDB,
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    createChat,
    updateChat,
    getChatsByUserId,
    getChatById,
    createMoodLog,
    getMoodHistory,
    createJournalEntry,
    getJournalEntries,
    updateUserStreak,
    getDataContext // Exported
};

// Mood Operations
async function createMoodLog(userId, moodLevel, note) {
    const [result] = await pool.execute(
        'INSERT INTO mood_logs (userId, moodLevel, note, createdAt) VALUES (?, ?, ?, ?)',
        [userId, moodLevel, note || null, new Date()]
    );
    return result;
}

async function getMoodHistory(userId, days = 7) {
    const [rows] = await pool.execute(
        'SELECT * FROM mood_logs WHERE userId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY createdAt ASC',
        [userId, days]
    );
    return rows;
}

// Journal Operations
async function createJournalEntry(userId, content, aiFeedback) {
    const [result] = await pool.execute(
        'INSERT INTO journal_entries (userId, content, aiFeedback, createdAt) VALUES (?, ?, ?, ?)',
        [userId, content, aiFeedback || null, new Date()]
    );
    return { id: result.insertId, userId, content, aiFeedback, createdAt: new Date() };
}

async function getJournalEntries(userId) {
    const [rows] = await pool.execute(
        'SELECT * FROM journal_entries WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
    );
    return rows;
}

// User Streak & Stats
async function updateUserStreak(userId) {
    // This is a simplified streak logic.
    // In a real app, you'd check lastStreakUpdate vs Today.
    // Here we just update the last login. Logic for calculation should be in the controller or here.
    const now = new Date();
    const [rows] = await pool.execute('SELECT streak, lastLogin, lastStreakUpdate FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) return;

    let { streak, lastStreakUpdate } = user;
    streak = streak || 0;

    // Check if last update was yesterday to increment, or today to ignore, or older to reset.
    // Simple logic:
    // If lastStreakUpdate is today (same date), do nothing.
    // If lastStreakUpdate is yesterday, increment.
    // Else, reset to 1.

    const today = new Date().toDateString();
    const lastDate = lastStreakUpdate ? new Date(lastStreakUpdate).toDateString() : null;

    let newStreak = streak;

    if (lastDate !== today) {
        if (lastDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.toDateString() === lastDate) {
                newStreak = streak + 1;
            } else {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        await pool.execute(
            'UPDATE users SET streak = ?, lastStreakUpdate = ?, lastLogin = ? WHERE id = ?',
            [newStreak, now, now, userId]
        );
    } else {
        // Just update lastLogin
        await pool.execute('UPDATE users SET lastLogin = ? WHERE id = ?', [now, userId]);
    }

    return newStreak;
}
