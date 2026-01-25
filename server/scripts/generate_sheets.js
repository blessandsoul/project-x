import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths (assuming running from server/ directory)
const COPART_PATH = path.join(__dirname, '../copart.json');
const IAA_PATH = path.join(__dirname, '../iaa.json');
const OUTPUT_DIR = path.join(__dirname, '../');

function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        process.exit(1);
    }
}

function processData(data, sourceName) {
    // Sort by state alphabetically
    data.sort((a, b) => a.state.localeCompare(b.state));

    let rows = [];
    // Header
    rows.push(['Location Name', 'My Price']);

    data.forEach(stateObj => {
        const state = stateObj.state;
        if (stateObj.locations && Array.isArray(stateObj.locations)) {
            // Sort locations by name within state for better organization
            stateObj.locations.sort((a, b) => a.name.localeCompare(b.name));

            stateObj.locations.forEach(loc => {
                // User requested State to be inside location name, separated by space.
                // e.g. "CA COPART SACRAMENTO" -> "CA SACRAMENTO" (Remove 'COPART')
                let cleanName = loc.name;

                // Remove "COPART" and extra spaces if present (mostly for Copart data)
                cleanName = cleanName.replace(/^COPART\s+/i, '');

                // Remove state suffix in parentheses for IAAI, e.g. "Abilene (TX)" -> "Abilene"
                cleanName = cleanName.replace(/\s*\([A-Z]{2}\)$/i, '');

                const combinedName = `${state} ${cleanName}`;
                rows.push([
                    `"${combinedName}"`,
                    '' // Empty 'My Price' column
                ]);
            });
        }
    });

    return rows.map(r => r.join(',')).join('\n');
}

function generateSheet(jsonPath, outputFilename, sourceName) {
    console.log(`Processing ${sourceName}...`);
    const data = loadJSON(jsonPath);
    const csvContent = processData(data, sourceName);
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    fs.writeFileSync(outputPath, csvContent);
    console.log(`Generated: ${outputPath}`);
}

// Ensure output directory exists (it's just server/ so it should)
if (!fs.existsSync(OUTPUT_DIR)) {
    console.error("Output directory does not exist.");
    process.exit(1);
}

generateSheet(COPART_PATH, 'Copart_Locations.csv', 'Copart');
generateSheet(IAA_PATH, 'IAAI_Locations.csv', 'IAAI');

console.log('Done!');
