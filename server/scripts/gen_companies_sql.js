const companyNames = [
    "Global Auto Logistics", "Fast Track Shipping", "Ocean Wide Transports", "Direct Auto Shipping",
    "Premium Car Haulers", "Viking Transports", "Eagle Eye Logistics", "Star Line Auto",
    "Blue Horizon Shipping", "Atlas Auto Transport", "Titan Cargo Solutions", "Velocity Vehicle Shipping",
    "Iron Horse Logistics", "Apex Auto Movers", "Liberty Car Transport", "United Global Shipping",
    "Rapid Route Logistics", "Summit Auto Transport", "Pacific Coast Shipping", "Golden State Haulers"
];

const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];

let sql = "-- Insert 20 Companies linked to company1@gmail.com ... company20@gmail.com\n";
sql += "INSERT INTO companies (owner_user_id, name, slug, country, city, state, phone_number, contact_email, is_active, description) VALUES \n";

let values = [];

for (let i = 1; i <= 20; i++) {
    const email = `company${i}@gmail.com`;
    const name = companyNames[i - 1];
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + i; // Ensure uniqueness
    const city = cities[i % cities.length];

    // Subquery to get the user ID
    // Note: We can't easily concatenate subqueries in a VALUES list in strict SQL modes sometimes, 
    // but usually in MySQL simple INSERT INTO ... SELECT is better, or strictly:
    // VALUES ((SELECT id...), ...) works in newer MySQL/MariaDB but sometimes fails.
    // SAFEST APPROACH: INSERT INTO ... SELECT ...
}

// Re-writing loop for safer valid SQL syntax for bulk insert with subqueries
// Ideally we run individual INSERT statements or ONE insert statement if we knew IDs.
// Since we don't know IDs, we must use INSERT INTO ... SELECT ...
// But we have 20 different SELECTs.

sql = "";
for (let i = 1; i <= 20; i++) {
    const email = `company${i}@gmail.com`;
    const name = companyNames[i - 1];
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + i;
    const city = cities[i % cities.length];

    sql += `INSERT INTO companies (owner_user_id, name, slug, country, city, state, phone_number, contact_email, is_active, description, base_price, price_per_mile)
SELECT id, '${name}', '${slug}', 'USA', '${city}', 'NY', '555-01${i.toString().padStart(2, '0')}', '${email}', 1, 'Professional auto transport services provided by ${name}.', 150.00, 1.50
FROM users WHERE email = '${email}';\n`;
}

// Now we also need to update the users table to link back to the company
// UPDATE users u INNER JOIN companies c ON u.id = c.owner_user_id SET u.company_id = c.id WHERE c.slug ...
sql += "\n-- Update users to link back to their companies\n";
sql += `UPDATE users u
JOIN companies c ON u.id = c.owner_user_id
SET u.company_id = c.id
WHERE u.role = 'company';`;

console.log(sql);
