const db = require('./db');

async function listTables() {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log('Tables in database:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listTables();
