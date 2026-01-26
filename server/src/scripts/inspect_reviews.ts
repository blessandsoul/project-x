import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || '127.0.0.1',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    try {
        const [users] = await connection.execute('SELECT id, username, email FROM users WHERE id IN (SELECT user_id FROM company_reviews)');
        console.log('--- USERS WITH REVIEWS ---');
        console.log(JSON.stringify(users, null, 2));

        const [reviews] = await connection.execute('SELECT id, user_id, rating, comment, company_reply FROM company_reviews LIMIT 20');
        console.log('--- REVIEWS ---');
        console.log(JSON.stringify(reviews, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
