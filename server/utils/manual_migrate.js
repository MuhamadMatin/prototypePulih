const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = process.env.JAWSDB_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pisikologchatbot'
};

async function runMigration() {
    console.log('Starting database migration...');
    let connection;
    try {
        if (typeof dbConfig === 'string') {
            connection = await mysql.createConnection(dbConfig);
        } else {
            connection = await mysql.createConnection(dbConfig);
        }

        const schemaPath = path.join(__dirname, '../config/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed statement.');
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
