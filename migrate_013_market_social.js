const db = require('./db');
const migrationName = '013_market_social';

async function runMigration() {
    console.log(`Starting migration: ${migrationName}`);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Add columns to market_items if they don't exist
        const [columns] = await connection.query("SHOW COLUMNS FROM market_items");
        const columnNames = columns.map(c => c.Field);
        
        if (!columnNames.includes('likes')) {
            await connection.query("ALTER TABLE market_items ADD COLUMN likes INT DEFAULT 0");
            console.log('Added likes column to market_items');
        }

        if (!columnNames.includes('reply_count')) {
            await connection.query("ALTER TABLE market_items ADD COLUMN reply_count INT DEFAULT 0");
            console.log('Added reply_count column to market_items');
        }

        // 2. Create market_likes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS market_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                market_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (market_id) REFERENCES market_items(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (market_id, user_id)
            )
        `);
        console.log('Created market_likes table');

        // 3. Create market_comments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS market_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                market_id INT NOT NULL,
                user_id INT NOT NULL,
                parent_id INT,
                content TEXT,
                likes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (market_id) REFERENCES market_items(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Created market_comments table');

        // 4. Create market_reports table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS market_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                market_id INT NOT NULL,
                reporter_id INT NOT NULL,
                reason TEXT,
                status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (market_id) REFERENCES market_items(id) ON DELETE CASCADE,
                FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Created market_reports table');

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
