const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra"
];

const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

let sql = "-- Update usernames for the 30 generic users to 'Firstname Lastname'\n";

// Map:
// user@gmail.com -> index 0
// user1@gmail.com -> index 1
// ...
// user29@gmail.com -> index 29

function generateName(index) {
    // Rotated combinations to ensure uniqueness
    const first = firstNames[index % firstNames.length];
    const last = lastNames[(index + 5) % lastNames.length]; // Offset to mix it up
    return `${first} ${last}`;
}

const emails = [];
emails.push('user@gmail.com');
for (let i = 1; i < 30; i++) {
    emails.push(`user${i}@gmail.com`);
}

emails.forEach((email, index) => {
    const newName = generateName(index);
    sql += `UPDATE users SET username = '${newName}' WHERE email = '${email}';\n`;
});

console.log(sql);
