
import 'dotenv/config';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import { uploadCompanyLogoSecure } from '../services/ImageUploadService.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLogo() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || '127.0.0.1',
        user: process.env.MYSQL_USER!,
        password: process.env.MYSQL_PASSWORD!,
        database: process.env.MYSQL_DATABASE!,
    });

    const [rows] = await connection.execute('SELECT slug FROM companies LIMIT 10');
    console.log('Slugs in DB:', rows);
    process.exit(0);

    const slug = 'test-company';
    const initial = 'T';
    const svg = `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red"/><text x="50%" y="50%" font-size="200" fill="white">${initial}</text></svg>`;
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

    console.log('Uploading PNG buffer...');
    const result = await uploadCompanyLogoSecure(buffer, 'image/png', slug);
    console.log('Result:', result);

    await connection.end();
}

testLogo();
