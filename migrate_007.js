const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '007_add_university_to_users.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);

        for (let statement of statements) {
            await db.query(statement);
        }
        console.log('Migration 007 completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
