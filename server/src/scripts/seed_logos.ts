
import 'dotenv/config';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
import { uploadCompanyLogoSecure } from '../services/ImageUploadService.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
    uri: process.env.DATABASE_URL,
};

// Vibrant gradients for logos
const GRADIENTS = [
    ['#4158D0', '#C850C0', '#FFCC70'],
    ['#0093E9', '#80D0C7'],
    ['#8EC5FC', '#E0C3FC'],
    ['#D9AFD9', '#97D9E1'],
    ['#FF9A9E', '#FECFEF'],
    ['#a18cd1', '#fbc2eb'],
    ['#fad0c4', '#ffd1ff'],
    ['#ff9a9e', '#fecfef'],
    ['#fbc2eb', '#a6c1ee'],
    ['#84fab0', '#8fd3f4'],
    ['#a1c4fd', '#c2e9fb'],
    ['#cfd9df', '#e2ebf0'],
    ['#ebc0fd', '#d9ded8'],
    ['#f6d365', '#fda085'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
];

function getRandomGradient() {
    return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function generateSvg(initials: string, colors: string[]): string {
    const stops = colors.map((color, index) => {
        const offset = Math.round((index / (colors.length - 1)) * 100);
        return `<stop offset="${offset}%" stop-color="${color}" />`;
    }).join('\n');

    return `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          ${stops}
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="50" ry="50" />
      <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;
}

async function seedLogos() {
    console.log('🌱 Starting company logo seeding...');

    try {
        console.log('Checking environment...');
        // Connect to database
        console.log('Connecting to database...');
        let connection;
        try {
            connection = await mysql.createConnection({
                host: process.env.MYSQL_HOST || '127.0.0.1',
                user: process.env.MYSQL_USER!,
                password: process.env.MYSQL_PASSWORD!,
                database: process.env.MYSQL_DATABASE!,
            });
        } catch (dbErr) {
            console.error('DB Connection Failed:', dbErr);
            throw dbErr;
        }

        console.log('✅ Connected to database');

        // Get all active companies
        const [rows] = await connection.execute('SELECT id, name, slug FROM companies WHERE is_active = 1');
        const companies = rows as Array<{ id: number; name: string; slug: string }>;

        console.log(`Found ${companies.length} active companies.`);

        for (const company of companies) {
            console.log(`Processing ${company.name} (${company.slug})...`);

            const initials = getInitials(company.name);
            const gradient = getRandomGradient()!;
            const svg = generateSvg(initials, gradient);

            // Convert SVG to PNG buffer
            const buffer = await sharp(Buffer.from(svg))
                .png()
                .toBuffer();

            // Upload logo
            // Mime type is 'image/png' since we converted it
            try {
                const result = await uploadCompanyLogoSecure(buffer, 'image/png', company.slug);
                console.log(`   ✅ Uploaded logo: ${result.url}`);
            } catch (err) {
                console.error(`   ❌ Failed to upload logo for ${company.name}:`, err);
            }
        }

        console.log('✨ Logo seeding completed!');
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

seedLogos();
