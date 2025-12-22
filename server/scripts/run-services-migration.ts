/**
 * Run database migration to create services table
 * 
 * Usage: npx tsx scripts/run-services-migration.ts
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        multipleStatements: true,
    });

    try {
        console.log('Connected to database');

        const migrationPath = path.join(__dirname, '..', 'migrations', 'create_services.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running services migration...');
        await connection.query(migrationSql);
        console.log('Migration completed successfully!');

        // Verify by querying the table
        const [rows] = await connection.query('SELECT * FROM services ORDER BY sort_order');
        console.log('Services in database:', rows);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
