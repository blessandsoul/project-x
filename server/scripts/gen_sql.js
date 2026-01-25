const hash = '$2b$12$/w268bPYf.6BcA4uKmgVpeQQlAv5MY3XeZb4KTBfb3pdLl3l.TrqMu';

let sql = "INSERT INTO users (email, username, password_hash, role, created_at, updated_at) VALUES\n";

// 30 Users
// user@gmail.com, then user1..user29
let users = [];
users.push(`('user@gmail.com', 'user', '${hash}', 'user', NOW(), NOW())`);
for (let i = 1; i < 30; i++) {
    users.push(`('user${i}@gmail.com', 'user${i}', '${hash}', 'user', NOW(), NOW())`);
}

// 20 Company Users
// company1..company20
for (let i = 1; i <= 20; i++) {
    users.push(`('company${i}@gmail.com', 'company${i}', '${hash}', 'company', NOW(), NOW())`);
}

sql += users.join(",\n") + ";";
console.log(sql);
