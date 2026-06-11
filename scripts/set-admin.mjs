import { connect } from '@tursodatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const db = connect({ url: envVars.TURSO_DATABASE_URL, authToken: envVars.TURSO_AUTH_TOKEN });

// List current users
const users = await db.execute('SELECT id, nickname, role FROM users');
console.log('Current users:');
for (const u of users.rows) {
  console.log(`  ${u.id}\t${u.nickname}\t${u.role}`);
}

// Set admin by nickname (change the nickname to target user)
const target = process.argv[2];
if (!target) {
  console.log('\nUsage: node scripts/set-admin.mjs <nickname>');
  console.log('Example: node scripts/set-admin.mjs 李小雨');
  process.exit(0);
}

const result = await db.execute({
  sql: "UPDATE users SET role = 'ADMIN' WHERE nickname = ?",
  args: [target]
});
console.log(`\n✓ Set "${target}" as ADMIN (${result.rowsAffected} row(s) updated)`);

// Verify
const verify = await db.execute('SELECT id, nickname, role FROM users');
for (const u of verify.rows) {
  console.log(`  ${u.id}\t${u.nickname}\t${u.role}`);
}
