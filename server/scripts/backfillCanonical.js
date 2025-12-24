/**
 * Backfill canonical columns for existing vehicles.
 * 
 * This script:
 * 1. Reads all vehicles with brand_name and model_name
 * 2. Generates canonical_brand and canonical_model_key for each
 * 3. Updates the database in batches
 * 
 * Usage: node scripts/backfillCanonical.js
 */

import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import canonicalizer (we'll inline the logic for standalone script)
// Since this is a standalone script, we inline the canonicalization logic

// ============================================================================
// CANONICALIZATION LOGIC (inlined from vehicleCanonicalizer.ts)
// ============================================================================

const BRAND_ALIASES = {
  'mercedes benz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
  'mercedesbenz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
  'mercedes-benz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
  'mercedes': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
  'bmw': { brand: 'BMW', key: 'bmw' },
  'chevrolet': { brand: 'Chevrolet', key: 'chevrolet' },
  'chevy': { brand: 'Chevrolet', key: 'chevrolet' },
  'volkswagen': { brand: 'Volkswagen', key: 'volkswagen' },
  'vw': { brand: 'Volkswagen', key: 'volkswagen' },
  'land rover': { brand: 'Land Rover', key: 'landrover' },
  'landrover': { brand: 'Land Rover', key: 'landrover' },
  'alfa romeo': { brand: 'Alfa Romeo', key: 'alfaromeo' },
  'alfaromeo': { brand: 'Alfa Romeo', key: 'alfaromeo' },
  'aston martin': { brand: 'Aston Martin', key: 'astonmartin' },
  'astonmartin': { brand: 'Aston Martin', key: 'astonmartin' },
  'harley-davidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
  'harley davidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
  'harleydavidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
  'harley': { brand: 'Harley-Davidson', key: 'harleydavidson' },
  'rolls-royce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
  'rolls royce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
  'rollsroyce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
};

const MODEL_PATTERNS = {
  'mercedesbenz': [
    { pattern: /^c[\s-]?class/i, family: 'cclass', displayName: 'C-Class' },
    { pattern: /^e[\s-]?class/i, family: 'eclass', displayName: 'E-Class' },
    { pattern: /^s[\s-]?class/i, family: 'sclass', displayName: 'S-Class' },
    { pattern: /^a[\s-]?class/i, family: 'aclass', displayName: 'A-Class' },
    { pattern: /^b[\s-]?class/i, family: 'bclass', displayName: 'B-Class' },
    { pattern: /^g[\s-]?class/i, family: 'gclass', displayName: 'G-Class' },
    { pattern: /^cla[\s-]?/i, family: 'cla', displayName: 'CLA' },
    { pattern: /^clk[\s-]?/i, family: 'clk', displayName: 'CLK' },
    { pattern: /^cls[\s-]?/i, family: 'cls', displayName: 'CLS' },
    { pattern: /^glc[\s-]?/i, family: 'glc', displayName: 'GLC' },
    { pattern: /^gle[\s-]?/i, family: 'gle', displayName: 'GLE' },
    { pattern: /^gls[\s-]?/i, family: 'gls', displayName: 'GLS' },
    { pattern: /^gla[\s-]?/i, family: 'gla', displayName: 'GLA' },
    { pattern: /^glb[\s-]?/i, family: 'glb', displayName: 'GLB' },
    { pattern: /^sl[\s-]?/i, family: 'sl', displayName: 'SL' },
    { pattern: /^slc[\s-]?/i, family: 'slc', displayName: 'SLC' },
    { pattern: /^slk[\s-]?/i, family: 'slk', displayName: 'SLK' },
    { pattern: /^amg[\s-]?gt/i, family: 'amggt', displayName: 'AMG GT' },
    { pattern: /^ml[\s-]?/i, family: 'ml', displayName: 'ML' },
    { pattern: /^gl[\s-]?/i, family: 'gl', displayName: 'GL' },
    { pattern: /^sprinter/i, family: 'sprinter', displayName: 'Sprinter' },
    { pattern: /^metris/i, family: 'metris', displayName: 'Metris' },
  ],
  'bmw': [
    { pattern: /^1[\s-]?series/i, family: '1series', displayName: '1 Series' },
    { pattern: /^2[\s-]?series/i, family: '2series', displayName: '2 Series' },
    { pattern: /^3[\s-]?series/i, family: '3series', displayName: '3 Series' },
    { pattern: /^4[\s-]?series/i, family: '4series', displayName: '4 Series' },
    { pattern: /^5[\s-]?series/i, family: '5series', displayName: '5 Series' },
    { pattern: /^6[\s-]?series/i, family: '6series', displayName: '6 Series' },
    { pattern: /^7[\s-]?series/i, family: '7series', displayName: '7 Series' },
    { pattern: /^8[\s-]?series/i, family: '8series', displayName: '8 Series' },
    { pattern: /^3\d{2}[deix]*/i, family: '3series', displayName: '3 Series' },
    { pattern: /^5\d{2}[deix]*/i, family: '5series', displayName: '5 Series' },
    { pattern: /^7\d{2}[deix]*/i, family: '7series', displayName: '7 Series' },
    { pattern: /^m2\b/i, family: 'm2', displayName: 'M2' },
    { pattern: /^m3\b/i, family: 'm3', displayName: 'M3' },
    { pattern: /^m4\b/i, family: 'm4', displayName: 'M4' },
    { pattern: /^m5\b/i, family: 'm5', displayName: 'M5' },
    { pattern: /^m6\b/i, family: 'm6', displayName: 'M6' },
    { pattern: /^m8\b/i, family: 'm8', displayName: 'M8' },
    { pattern: /^x1\b/i, family: 'x1', displayName: 'X1' },
    { pattern: /^x2\b/i, family: 'x2', displayName: 'X2' },
    { pattern: /^x3\b/i, family: 'x3', displayName: 'X3' },
    { pattern: /^x4\b/i, family: 'x4', displayName: 'X4' },
    { pattern: /^x5\b/i, family: 'x5', displayName: 'X5' },
    { pattern: /^x6\b/i, family: 'x6', displayName: 'X6' },
    { pattern: /^x7\b/i, family: 'x7', displayName: 'X7' },
    { pattern: /^i3\b/i, family: 'i3', displayName: 'i3' },
    { pattern: /^i4\b/i, family: 'i4', displayName: 'i4' },
    { pattern: /^i5\b/i, family: 'i5', displayName: 'i5' },
    { pattern: /^i7\b/i, family: 'i7', displayName: 'i7' },
    { pattern: /^i8\b/i, family: 'i8', displayName: 'i8' },
    { pattern: /^ix\b/i, family: 'ix', displayName: 'iX' },
    { pattern: /^z3\b/i, family: 'z3', displayName: 'Z3' },
    { pattern: /^z4\b/i, family: 'z4', displayName: 'Z4' },
  ],
  'ford': [
    { pattern: /^f[\s-]?150/i, family: 'f150', displayName: 'F-150' },
    { pattern: /^f[\s-]?250/i, family: 'f250', displayName: 'F-250' },
    { pattern: /^f[\s-]?350/i, family: 'f350', displayName: 'F-350' },
    { pattern: /^mustang/i, family: 'mustang', displayName: 'Mustang' },
    { pattern: /^explorer/i, family: 'explorer', displayName: 'Explorer' },
    { pattern: /^escape/i, family: 'escape', displayName: 'Escape' },
    { pattern: /^edge/i, family: 'edge', displayName: 'Edge' },
    { pattern: /^fusion/i, family: 'fusion', displayName: 'Fusion' },
    { pattern: /^focus/i, family: 'focus', displayName: 'Focus' },
    { pattern: /^bronco/i, family: 'bronco', displayName: 'Bronco' },
    { pattern: /^ranger/i, family: 'ranger', displayName: 'Ranger' },
    { pattern: /^transit/i, family: 'transit', displayName: 'Transit' },
  ],
  'toyota': [
    { pattern: /^camry/i, family: 'camry', displayName: 'Camry' },
    { pattern: /^corolla/i, family: 'corolla', displayName: 'Corolla' },
    { pattern: /^rav[\s-]?4/i, family: 'rav4', displayName: 'RAV4' },
    { pattern: /^highlander/i, family: 'highlander', displayName: 'Highlander' },
    { pattern: /^tacoma/i, family: 'tacoma', displayName: 'Tacoma' },
    { pattern: /^tundra/i, family: 'tundra', displayName: 'Tundra' },
    { pattern: /^4[\s-]?runner/i, family: '4runner', displayName: '4Runner' },
    { pattern: /^prius/i, family: 'prius', displayName: 'Prius' },
    { pattern: /^sienna/i, family: 'sienna', displayName: 'Sienna' },
    { pattern: /^supra/i, family: 'supra', displayName: 'Supra' },
    { pattern: /^land[\s-]?cruiser/i, family: 'landcruiser', displayName: 'Land Cruiser' },
  ],
  'honda': [
    { pattern: /^accord/i, family: 'accord', displayName: 'Accord' },
    { pattern: /^civic/i, family: 'civic', displayName: 'Civic' },
    { pattern: /^cr[\s-]?v/i, family: 'crv', displayName: 'CR-V' },
    { pattern: /^hr[\s-]?v/i, family: 'hrv', displayName: 'HR-V' },
    { pattern: /^pilot/i, family: 'pilot', displayName: 'Pilot' },
    { pattern: /^odyssey/i, family: 'odyssey', displayName: 'Odyssey' },
    { pattern: /^ridgeline/i, family: 'ridgeline', displayName: 'Ridgeline' },
  ],
  'chevrolet': [
    { pattern: /^silverado/i, family: 'silverado', displayName: 'Silverado' },
    { pattern: /^tahoe/i, family: 'tahoe', displayName: 'Tahoe' },
    { pattern: /^suburban/i, family: 'suburban', displayName: 'Suburban' },
    { pattern: /^equinox/i, family: 'equinox', displayName: 'Equinox' },
    { pattern: /^malibu/i, family: 'malibu', displayName: 'Malibu' },
    { pattern: /^camaro/i, family: 'camaro', displayName: 'Camaro' },
    { pattern: /^corvette/i, family: 'corvette', displayName: 'Corvette' },
    { pattern: /^colorado/i, family: 'colorado', displayName: 'Colorado' },
    { pattern: /^blazer/i, family: 'blazer', displayName: 'Blazer' },
  ],
};

function toKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function canonicalizeBrand(rawBrand) {
  if (!rawBrand) return { brand: 'Unknown', key: 'unknown' };
  
  const normalized = rawBrand.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const alias = BRAND_ALIASES[normalized];
  if (alias) return alias;
  
  const noSpaces = normalized.replace(/\s+/g, '');
  const aliasNoSpaces = BRAND_ALIASES[noSpaces];
  if (aliasNoSpaces) return aliasNoSpaces;
  
  const titleCase = rawBrand
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return { brand: titleCase, key: toKey(rawBrand) };
}

function canonicalizeModel(rawModel, brandKey) {
  if (!rawModel) return { modelKey: 'unknown', displayName: 'Unknown' };
  
  const trimmed = rawModel.trim();
  const brandPatterns = MODEL_PATTERNS[brandKey];
  
  if (brandPatterns) {
    for (const { pattern, family, displayName } of brandPatterns) {
      if (pattern.test(trimmed)) {
        return { modelKey: family, displayName };
      }
    }
  }
  
  return { modelKey: toKey(trimmed), displayName: trimmed.replace(/\s+/g, ' ').trim() };
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillCanonical() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('✅ Database connection established');

  try {
    // Get total count
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM vehicles');
    console.log(`📦 Total vehicles to process: ${total}`);

    const BATCH_SIZE = 1000;
    let processed = 0;
    let updated = 0;

    while (processed < total) {
      // Fetch a batch of vehicles
      const [rows] = await pool.execute(
        `SELECT id, brand_name, model_name FROM vehicles ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${processed}`
      );

      if (rows.length === 0) break;

      // Process and update each vehicle
      for (const row of rows) {
        const { brand, key: brandKey } = canonicalizeBrand(row.brand_name);
        const { modelKey } = canonicalizeModel(row.model_name, brandKey);

        await pool.execute(
          'UPDATE vehicles SET canonical_brand = ?, canonical_model_key = ? WHERE id = ?',
          [brand, modelKey, row.id]
        );
        updated++;
      }

      processed += rows.length;
      console.log(`📊 Progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`);
    }

    console.log('\n✅ Backfill Complete!');
    console.log('─'.repeat(40));
    console.log(`Vehicles processed: ${processed}`);
    console.log(`Vehicles updated: ${updated}`);
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}

backfillCanonical();
