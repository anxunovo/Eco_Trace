import { connect } from '@tursodatabase/serverless';
import { readFileSync } from 'fs';
import {
  DB_CARBON_COEFFICIENTS,
  carbonCoefficientSyncStatements,
} from './lib/carbon-coefficients.mjs';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars');
  process.exit(1);
}

const db = connect({ url: TURSO_URL, authToken: TURSO_TOKEN });

const seedContent = readFileSync('new-site/public/assets/seed.js', 'utf8');

// Extract helper functions
const now = Date.now();
const hAgo = h => new Date(now - h * 3600000).toISOString();
const hLater = h => new Date(now + h * 3600000).toISOString();
const dAgo = d => hAgo(d * 24);
const IMG = name => '/assets/seed-images/' + name;

// Extract SEED_USERS
const usersMatch = seedContent.match(/SEED_USERS\s*=\s*(\[[\s\S]*?\]);/);
const SEED_USERS = eval(usersMatch[1]);

// Extract SEED_LISTINGS
const listingsMatch = seedContent.match(/SEED_LISTINGS\s*=\s*(\[[\s\S]*?\]);\s*\n\s*export/);
const listingsBody = listingsMatch ? listingsMatch[1] : seedContent.match(/SEED_LISTINGS\s*=\s*(\[[\s\S]*\]);\s*$/)[1];
const SEED_LISTINGS = eval(listingsBody);

console.log(`Seeding ${SEED_USERS.length} users, ${SEED_LISTINGS.length} listings...`);

// Insert users
for (const u of SEED_USERS) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, nickname, avatar, school, campus, role, eco_points)
          VALUES (?, ?, ?, ?, ?, ?, 0)`,
    args: [u.id, u.nickname, u.avatar, u.school, u.campus, u.role]
  });
}
console.log(`✓ ${SEED_USERS.length} users inserted`);

// Insert listings
for (const l of SEED_LISTINGS) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO listings (
      id, owner_id, title, description, category, trade_mode, price, swap_wanted,
      condition, campus, location_text, contact_method, contact_value,
      images, estimated_weight_kg, estimated_carbon_saved_kg,
      ai_confidence, ai_assumptions, is_food, food_info, tags,
      interested_count, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      l.id, l.ownerId, l.title, l.description || '', l.category,
      l.tradeMode, l.price || null, l.swapWanted || null,
      l.condition || 'GOOD', l.campus || '', l.locationText || '',
      l.contactMethod || 'wechat', l.contactValue || '',
      JSON.stringify(l.images || []),
      l.estimatedWeightKg || null, l.estimatedCarbonSavedKg || 0,
      l.aiConfidence || null, JSON.stringify(l.aiAssumptions || []),
      l.isFood ? 1 : 0, l.foodInfo ? JSON.stringify(l.foodInfo) : null,
      JSON.stringify(l.tags || []),
      l.interestedCount || 0, l.status || 'ACTIVE',
      l.createdAt || new Date().toISOString()
    ]
  });
}
console.log(`✓ ${SEED_LISTINGS.length} listings inserted`);

// Insert carbon coefficients from the same catalog used by the browser estimator.
const COEFFICIENTS = DB_CARBON_COEFFICIENTS;

for (const c of COEFFICIENTS) {
  for (const stmt of carbonCoefficientSyncStatements(c)) {
    await db.execute(stmt);
  }
}
console.log(`✓ ${COEFFICIENTS.length} carbon coefficients inserted`);

// Verify
const counts = {};
for (const table of ['users', 'listings', 'carbon_coefficients']) {
  const r = await db.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
  counts[table] = r.rows[0][0];
}
console.log('\nVerification:', JSON.stringify(counts));
