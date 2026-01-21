const updates = [
    { id: 1, name: "Caucasus Auto" },
    // 2-5 skipped
    { id: 6, name: "Usglobal" },
    { id: 7, name: "Hoa Auto Import" },
    { id: 8, name: "2Mcars Georgia" },
    { id: 9, name: "Carspace" },
    { id: 10, name: "Carland" },
    { id: 11, name: "Peace Global Logistics" },
    { id: 12, name: "CarNow" },
    { id: 13, name: "Global Auto Import" },
    { id: 14, name: "MC TRANS" },
    { id: 15, name: "Indigo Cars" },
    { id: 16, name: "Star Auto Import" },
    { id: 17, name: "Caucasus Auto Market" },
    { id: 18, name: "Lion Auto" },
    { id: 19, name: "GLOBAL AUTO IMPORT" },
    { id: 20, name: "Auto Import Georgia" }
];

let sql = "-- Update company names and descriptions\n";

updates.forEach(update => {
    const email = `company${update.id}@gmail.com`;
    const slug = update.name.toLowerCase().replace(/ /g, '-') + '-' + update.id;
    const desc = `Professional auto transport and import services provided by ${update.name}. We specialize in shipping vehicles to your location.`;

    // Update name, slug, descriptions based on contact_email (which we set to companyX@gmail.com)
    sql += `UPDATE companies SET 
    name = '${update.name}', 
    slug = '${slug}',
    description_eng = '${desc}',
    description_geo = '${desc}',
    description_rus = '${desc}'
WHERE contact_email = '${email}';\n`;
});

console.log(sql);
