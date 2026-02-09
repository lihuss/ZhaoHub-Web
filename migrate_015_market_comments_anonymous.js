const db = require('./db');
const migrationName = '015_market_comments_anonymous';

async function runMigration() {
    console.log(`Starting migration: ${migrationName}`);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Add is_anonymous column to market_comments if it doesn't exist
        const [columns] = await connection.query("SHOW COLUMNS FROM market_comments");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('is_anonymous')) {
            await connection.query("ALTER TABLE market_comments ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0");
            console.log('Added is_anonymous column to market_comments');
        } else {
             console.log('is_anonymous column already exists in market_comments');
        }

        await connection.commit();
        console.log(`Migration ${migrationName} completed successfully.`);
    } catch (err) {
        await connection.rollback();
        console.error(`Migration ${migrationName} failed:`, err);
    } finally {
        connection.release();
        process.exit();
    }
}

runMigration();