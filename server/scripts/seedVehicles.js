/**
 * Standalone script to seed vehicle_makes and vehicle_models tables
 * from makemodels.json file.
 *
 * Usage: node scripts/seedVehicles.js
 *
 * Requirements:
 * - Set environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE)
 * - Or create a .env file in the server directory
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate required environment variables
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

/**
 * Main seeding function
 */
async function seedVehicles() {
  let pool = null;

  try {
    // Create database connection pool
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    console.log('✅ Database connection established');

    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'makemodels.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonContent);

    if (!data.makes || typeof data.makes !== 'object') {
      throw new Error('Invalid JSON structure: "makes" object not found');
    }

    const makes = Object.entries(data.makes);
    console.log(`📦 Found ${makes.length} makes to process`);

    let makesInserted = 0;
    let makesSkipped = 0;
    let modelsInserted = 0;
    let modelsSkipped = 0;

    // Process each make
    for (const [makeName, makeData] of makes) {
      let makeId;

      // Check if make already exists
      const [existingMakes] = await pool.execute(
        'SELECT id FROM vehicle_makes WHERE name = ? LIMIT 1',
        [makeName]
      );

      if (existingMakes.length > 0) {
        // Make exists, get its ID
        makeId = existingMakes[0].id;
        makesSkipped++;
      } else {
        // Insert new make
        const [result] = await pool.execute(
          'INSERT INTO vehicle_makes (name, is_valid) VALUES (?, ?)',
          [makeName, makeData.is_valid ? 1 : 0]
        );
        makeId = result.insertId;
        makesInserted++;
      }

      // Process models for this make
      if (makeData.models && typeof makeData.models === 'object') {
        const models = Object.entries(makeData.models);

        for (const [modelName, modelData] of models) {
          // Check if model already exists for this make
          const [existingModels] = await pool.execute(
            'SELECT id FROM vehicle_models WHERE make_id = ? AND name = ? LIMIT 1',
            [makeId, modelName]
          );

          if (existingModels.length > 0) {
            // Model exists, skip
            modelsSkipped++;
          } else {
            // Insert new model
            await pool.execute(
              'INSERT INTO vehicle_models (make_id, name, vehicle_type, is_valid) VALUES (?, ?, ?, ?)',
              [
                makeId,
                modelName,
                modelData.vehicle_type || null,
                modelData.is_valid ? 1 : 0,
              ]
            );
            modelsInserted++;
          }
        }
      }
    }

    console.log('\n📊 Seeding Complete!');
    console.log('─'.repeat(40));
    console.log(`Makes inserted:  ${makesInserted}`);
    console.log(`Makes skipped:   ${makesSkipped} (already existed)`);
    console.log(`Models inserted: ${modelsInserted}`);
    console.log(`Models skipped:  ${modelsSkipped} (already existed)`);
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the seeder
seedVehicles();
