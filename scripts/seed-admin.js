// scripts/seed-admin.js
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function seedAdmin() {
  const email = 'admin@coinplus.com';
  const plainPassword = 'Admin@123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Check if admin exists
  const existing = await sql`SELECT * FROM admin_users WHERE email = ${email}`;
  if (existing.length > 0) {
    // Update password
    await sql`UPDATE admin_users SET password_hash = ${hashedPassword} WHERE email = ${email}`;
    console.log('✅ Admin password updated.');
  } else {
    // Insert new admin
    await sql`INSERT INTO admin_users (email, password_hash) VALUES (${email}, ${hashedPassword})`;
    console.log('✅ Admin user created.');
  }
}

seedAdmin().catch(console.error);