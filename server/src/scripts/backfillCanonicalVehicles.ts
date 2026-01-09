/**
 * Backfill Canonical Vehicle Data
 * 
 * This script updates all existing vehicles in the database with their
 * canonical brand and model values for normalized searching.
 * 
 * Run this after applying the add_canonical_vehicle_columns migration.
 * 
 * Usage:
 *   node dist/scripts/backfillCanonicalVehicles.js
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { canonicalizeVehicle } from '../utils/vehicleCanonicalizer.js';

async function main() {
    // Validate required environment variables
    if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
        throw new Error('Missing required environment variables: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
    }

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    console.log('Connected to database');

    // Fetch all vehicles with brand_name and model_name
    const [vehicles] = await connection.execute(
        'SELECT id, brand_name, model_name FROM vehicles WHERE brand_name IS NOT NULL AND model_name IS NOT NULL'
    );

    console.log(`Found ${(vehicles as any[]).length} vehicles to update`);

    let updated = 0;
    let failed = 0;

    for (const vehicle of vehicles as any[]) {
        try {
            const { canonical_brand, canonical_brand_key, canonical_model_key } = canonicalizeVehicle(
                vehicle.brand_name,
                vehicle.model_name
            );

            await connection.execute(
                `UPDATE vehicles 
         SET canonical_brand = ?, 
             canonical_brand_key = ?, 
             canonical_model_key = ? 
         WHERE id = ?`,
                [canonical_brand, canonical_brand_key, canonical_model_key, vehicle.id]
            );

            updated++;

            if (updated % 1000 === 0) {
                console.log(`Updated ${updated} vehicles...`);
            }
        } catch (error) {
            console.error(`Failed to update vehicle ${vehicle.id}:`, error);
            failed++;
        }
    }

    console.log(`\nBackfill complete!`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Failed: ${failed}`);

    await connection.end();
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
