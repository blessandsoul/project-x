import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read both JSON files
const copartData = JSON.parse(fs.readFileSync(path.join(__dirname, 'copart.json'), 'utf8'));
const iaaiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'iaa.json'), 'utf8'));

// Extract all city names from both sources
const citySet = new Set();

// Extract from Copart
copartData.forEach(state => {
    state.locations.forEach(location => {
        if (location.city) {
            citySet.add(location.city.trim());
        }
    });
});

// Extract from IAAI
iaaiData.forEach(state => {
    state.locations.forEach(location => {
        if (location.city) {
            citySet.add(location.city.trim());
        }
    });
});

// Convert to sorted array
const cities = Array.from(citySet).sort();

console.log(`Found ${cities.length} unique city names\n`);

// Generate MySQL INSERT query
const values = cities.map(city => {
    // Escape single quotes for SQL
    const escaped = city.replace(/'/g, "''");
    return `('${escaped}')`;
}).join(',\n    ');

const sqlQuery = `-- Insert ${cities.length} unique city names from Copart and IAAI
INSERT INTO cities (city) VALUES
    ${values};`;

// Write to SQL file
fs.writeFileSync(path.join(__dirname, 'insert_cities.sql'), sqlQuery, 'utf8');

console.log('✅ SQL query generated successfully!');
console.log('📁 File saved as: insert_cities.sql');
console.log(`\n📊 Total cities to insert: ${cities.length}`);
console.log('\n🔍 First 10 cities:');
cities.slice(0, 10).forEach(city => console.log(`   - ${city}`));
