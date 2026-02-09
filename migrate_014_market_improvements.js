const db = require('./db');
const migrationName = '014_market_improvements';

async function runMigration() {
    console.log(`Starting migration: ${migrationName}`);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Add is_anonymous column to market_items
        const [columns] = await connection.query("SHOW COLUMNS FROM market_items");
        const columnNames = columns.map(c => c.Field);
        
        if (!columnNames.includes('is_anonymous')) {
            await connection.query("ALTER TABLE market_items ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0");
            console.log('Added is_anonymous column to market_items');
        }

        // 2. Change image_url to image TEXT (to support multiple images/JSON)
        // If image_url exists and image does not, we rename/modify it.
        // We will assume image_url stores a single string for now.
        if (columnNames.includes('image_url')) {
            // Rename image_url to image and change type to TEXT
            await connection.query("ALTER TABLE market_items CHANGE image_url image TEXT");
            console.log('Renamed image_url to image and changed type to TEXT');
            
            // Convert existing single URL to JSON array format if it's not null/empty
            // However, doing this in specific SQL might be tricky if data exists. 
            // Simple way for existing data (if any) is just leave it as string, 
            // the ejs logic will handle if it's not a JSON array.
            // Or we check existing data. Since this is likely dev/prototype, we might be fine.
            // But to be safe, let's update data.
            /*
            const [rows] = await connection.query("SELECT id, image FROM market_items WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '[%'");
            for (const row of rows) {
                const newImage = JSON.stringify([row.image]);
                await connection.query("UPDATE market_items SET image = ? WHERE id = ?", [newImage, row.id]);
            }
            */
        } else if (!columnNames.includes('image')) {
             // If image_url doesn't exist (fresh DB?) but also no image
             await connection.query("ALTER TABLE market_items ADD COLUMN image TEXT");
             console.log('Added image column to market_items');
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
