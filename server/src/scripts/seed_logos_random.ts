
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadCompanyLogoSecure } from '../services/ImageUploadService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedRandomLogos() {
    console.log('🎲 Starting random logo seeding...');

    try {
        // 1. Read logo files
        const logoDir = path.join(process.cwd(), 'comp-logos');
        console.log(`Reading logos from: ${logoDir}`);

        let logoFiles: string[] = [];
        try {
            logoFiles = await fs.readdir(logoDir);
            logoFiles = logoFiles.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        } catch (e) {
            console.error(`❌ Could not read comp-logos directory:`, e);
            process.exit(1);
        }

        if (logoFiles.length === 0) {
            console.error('❌ No image files found in comp-logos directory');
            process.exit(1);
        }

        console.log(`Found ${logoFiles.length} candidate logos.`);

        // 2. Connect to DB
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || '127.0.0.1',
            user: process.env.MYSQL_USER!,
            password: process.env.MYSQL_PASSWORD!,
            database: process.env.MYSQL_DATABASE!,
        });
        console.log('✅ Connected to database');

        // 3. Get active companies
        const [rows] = await connection.execute('SELECT id, name, slug FROM companies WHERE is_active = 1');
        const companies = rows as Array<{ id: number; name: string; slug: string }>;

        console.log(`Found ${companies.length} active companies.`);

        // 4. Assign random logos
        for (const company of companies) {
            // Pick random file
            const randomFile = logoFiles[Math.floor(Math.random() * logoFiles.length)];
            const filePath = path.join(logoDir, randomFile!);

            console.log(`Processing ${company.name} -> ${randomFile}`);

            try {
                const buffer = await fs.readFile(filePath);
                // We don't trust the extension, checking magic bytes is handled by the service, 
                // but passing a hint based on file extension is good practice or just generic 'image/png' if uncertain,
                // however the service takes a declared mime. Let's infer it roughly.
                const ext = path.extname(randomFile!).toLowerCase();
                let mime = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
                if (ext === '.webp') mime = 'image/webp';

                const result = await uploadCompanyLogoSecure(buffer, mime, company.slug);
                console.log(`   ✅ Uploaded: ${result.url}`);
            } catch (err) {
                console.error(`   ❌ Failed to upload for ${company.name}:`, err);
            }
        }

        console.log('✨ Random logo seeding completed!');
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

seedRandomLogos();
