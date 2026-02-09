const db = require('./db');
const migrationName = '012_market_tables';

async function runMigration() {
    console.log(`Starting migration: ${migrationName}`);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'market_items'");
        if (tables.length === 0) {
            await connection.query(`
                CREATE TABLE market_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    price VARCHAR(100),
                    contact_info TEXT,
                    image_url VARCHAR(255),
                    status ENUM('active', 'sold', 'removed') DEFAULT 'active',
                    view_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('Created market_items table.');
        } else {
            console.log('market_items table already exists.');
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
