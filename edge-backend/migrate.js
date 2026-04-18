import pool from './config/db.js';

const migrate = async () => {
    try {
        await pool.query(`ALTER TABLE apis ADD COLUMN IF NOT EXISTS route_prefix VARCHAR(100);`);
        console.log("Migration successful: route_prefix added.");
    } catch (e) {
        console.error("Migration error:", e.message);
    } finally {
        process.exit();
    }
};

migrate();
