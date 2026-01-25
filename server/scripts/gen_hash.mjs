import bcrypt from 'bcryptjs';

async function generate() {
    const hash = await bcrypt.hash('user123', 12);
    console.log(hash);
}

generate();
