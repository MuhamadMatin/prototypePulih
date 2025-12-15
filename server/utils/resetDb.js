const { pool, initDB } = require('./db');

async function resetDb() {
    console.log("⚠️  RESETTING DATABASE...");
    const conn = await pool.getConnection();
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('DROP TABLE IF EXISTS journal_entries');
        await conn.query('DROP TABLE IF EXISTS mood_logs');
        await conn.query('DROP TABLE IF EXISTS chats');
        await conn.query('DROP TABLE IF EXISTS users');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("All tables dropped.");

        // Re-init
        await initDB();

        console.log("✅ Database Cleaned & Re-initialized.");
        process.exit(0);
    } catch (e) {
        console.error("Reset Failed:", e);
        process.exit(1);
    } finally {
        conn.release();
    }
}

resetDb();
