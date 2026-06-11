import { readFileSync } from 'fs';

const TURSO_URL = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://');
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars');
  process.exit(1);
}

const schema = readFileSync('netlify/functions/_lib/schema.sql', 'utf8');
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

// Add migration statements for existing tables
// Only add if column doesn't exist yet — ALTER TABLE errors are non-fatal
const migrations = [
  "ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''",
];

console.log(`Applying ${statements.length} schema statements to ${TURSO_URL}...`);

const res = await fetch(TURSO_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TURSO_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    statements: statements.map(sql => ({ q: sql })),
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`HTTP ${res.status}: ${text}`);
  process.exit(1);
}

const data = await res.json();
let errors = 0;
for (let i = 0; i < data.length; i++) {
  if (data[i].error) {
    const msg = data[i].error.message || JSON.stringify(data[i].error);
    if (msg.includes('duplicate column') || msg.includes('already exists')) {
      // Already applied, skip
    } else {
      console.error(`Statement ${i + 1} error:`, msg);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log(`Schema applied successfully (${statements.length} statements)`);
} else {
  console.error(`${errors} errors out of ${statements.length} statements`);
  process.exit(1);
}
