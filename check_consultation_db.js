const db = require('./db');

async function checkTables() {
    try {
        const [rows] = await db.query("SHOW TABLES LIKE 'consultation_%'");
        console.log('Consultation tables found:', rows.map(r => Object.values(r)[0]));
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err);
        process.exit(1);
    }
}

checkTables();
