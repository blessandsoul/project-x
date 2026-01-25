
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import readline from 'readline';
import 'dotenv/config';

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

async function main() {
    console.log('🚀 Database Migration Runner');
    console.log('-----------------------------------');

    // 1. Check if migrations directory exists
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.error(`❌ Migrations directory not found at: ${MIGRATIONS_DIR}`);
        process.exit(1);
    }

    // 2. List migration files
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    if (files.length === 0) {
        console.log('⚠️  No .sql files found in migrations directory.');
        process.exit(0);
    }

    console.log(`\nFound ${files.length} migration files:`);
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });

    // 3. Prompt user
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (q: string): Promise<string> => {
        return new Promise(resolve => rl.question(q, resolve));
    };

    // Environment override prompt
    console.log('\n-----------------------------------');
    console.log(`Target Database: ${process.env.MYSQL_DATABASE || 'Not Set'}`);
    console.log(`Host: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || '3306'}`);
    console.log(`User: ${process.env.MYSQL_USER || 'root'}`);
    console.log('-----------------------------------');
    const confirmEnv = await question('Use these .env settings? (Y/n): ');

    let connectionConfig = {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || '',
        multipleStatements: true // Important for migrations!
    };

    if (confirmEnv.toLowerCase() === 'n') {
        connectionConfig.host = await question('DB Host (127.0.0.1): ') || '127.0.0.1';
        connectionConfig.port = parseInt(await question('DB Port (3306): ') || '3306');
        connectionConfig.user = await question('DB User: ');
        connectionConfig.password = await question('DB Password: ');
        connectionConfig.database = await question('DB Name: ');
    }

    const selection = await question('\nEnter file number to run (or "exit"): ');

    if (selection.toLowerCase() === 'exit') {
        rl.close();
        process.exit(0);
    }

    const fileIndex = parseInt(selection) - 1;
    if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= files.length) {
        console.error('❌ Invalid selection.');
        rl.close();
        process.exit(1);
    }

    const selectedFile = files[fileIndex];
    const filePath = path.join(MIGRATIONS_DIR, selectedFile);

    console.log(`\nRunning: ${selectedFile}...`);

    try {
        // Read SQL
        const sql = fs.readFileSync(filePath, 'utf8');

        // Connect
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to database.');

        // Execute
        await connection.query(sql);
        console.log(`✅ Successfully executed ${selectedFile}`);

        await connection.end();
    } catch (err) {
        console.error('❌ Error executing migration:');
        console.error(err);
    } finally {
        rl.close();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
