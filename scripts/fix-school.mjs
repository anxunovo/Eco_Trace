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

const users = await db.execute('SELECT nickname, school, campus FROM users');
for (const u of users.rows) {
  console.log(`${u.nickname}\t${u.school}\t${u.campus}`);
}
