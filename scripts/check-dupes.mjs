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

const r = await db.execute('SELECT id, title, status FROM listings ORDER BY title');
console.log(`Total listings: ${r.rows.length}\n`);
for (const l of r.rows) {
  console.log(`${l.id}\t${l.status}\t${l.title}`);
}

// Check for duplicate titles
const dupes = await db.execute('SELECT title, COUNT(*) as cnt FROM listings GROUP BY title HAVING cnt > 1');
if (dupes.rows.length) {
  console.log('\n⚠ Duplicate titles:');
  for (const d of dupes.rows) {
    console.log(`  "${d.title}" x${d.cnt}`);
  }
}
