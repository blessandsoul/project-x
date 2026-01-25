const companyNames = [
    "Global Auto Logistics", "Fast Track Shipping", "Ocean Wide Transports", "Direct Auto Shipping",
    "Premium Car Haulers", "Viking Transports", "Eagle Eye Logistics", "Star Line Auto",
    "Blue Horizon Shipping", "Atlas Auto Transport", "Titan Cargo Solutions", "Velocity Vehicle Shipping",
    "Iron Horse Logistics", "Apex Auto Movers", "Liberty Car Transport", "United Global Shipping",
    "Rapid Route Logistics", "Summit Auto Transport", "Pacific Coast Shipping", "Golden State Haulers"
];

const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];

// Correct column names based on user feedback: description_eng, description_geo, description_rus
let sql = "-- Insert 20 Companies linked to company1@gmail.com ... company20@gmail.com\n";
sql += "-- Used columns: description_eng, description_geo, description_rus\n\n";

for (let i = 1; i <= 20; i++) {
    const email = `company${i}@gmail.com`;
    const name = companyNames[i - 1];
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + i;
    const city = cities[i % cities.length];
    const desc = `Professional auto transport services provided by ${name}.`;

    // We update the INSERT to use the specific language columns requested by user
    sql += `INSERT INTO companies (owner_user_id, name, slug, country, city, state, phone_number, contact_email, is_active, description_eng, description_geo, description_rus, base_price, price_per_mile)
SELECT id, '${name}', '${slug}', 'USA', '${city}', 'NY', '555-01${i.toString().padStart(2, '0')}', '${email}', 1, '${desc}', '${desc}', '${desc}', 150.00, 1.50
FROM users WHERE email = '${email}';\n`;
}

// Update users link
sql += "\n-- Update users to link back to their companies\n";
sql += `UPDATE users u
JOIN companies c ON u.id = c.owner_user_id
SET u.company_id = c.id
WHERE u.role = 'company';`;

console.log(sql);
