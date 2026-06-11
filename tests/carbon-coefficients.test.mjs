import assert from 'node:assert/strict';
import {
  CATEGORIES,
  FOOD_SUBCATS,
  CARBON_COEFFICIENTS,
  estimateCarbonFromCatalog,
} from '../new-site/public/assets/carbon-coefficients.js';
import {
  DB_CARBON_COEFFICIENTS,
  carbonCoefficientSyncStatements,
} from '../scripts/lib/carbon-coefficients.mjs';

function activeCoeff(category, subcategory = null) {
  return CARBON_COEFFICIENTS.find(c =>
    c.category === category && (c.subcategory ?? null) === subcategory
  );
}

for (const category of CATEGORIES) {
  const coeff = activeCoeff(category.key, null);
  assert.ok(coeff, `missing DB coefficient for ${category.key}`);
  assert.equal(coeff.mode, category.mode, `${category.key} mode mismatch`);
  assert.equal(coeff.factor, category.factor, `${category.key} factor mismatch`);
  assert.equal(coeff.substitutionRate, category.substitution, `${category.key} substitution mismatch`);
  assert.equal(coeff.defaultWeightKg ?? undefined, category.defaultWeight, `${category.key} default weight mismatch`);
}

for (const [key, food] of Object.entries(FOOD_SUBCATS)) {
  const coeff = activeCoeff('FOOD', key);
  assert.ok(coeff, `missing DB coefficient for FOOD/${key}`);
  assert.equal(coeff.mode, 'per_kg', `FOOD/${key} mode mismatch`);
  assert.equal(coeff.factor, food.factor, `FOOD/${key} factor mismatch`);
  assert.equal(coeff.substitutionRate, 1.0, `FOOD/${key} substitution mismatch`);
}

assert.equal(DB_CARBON_COEFFICIENTS.length, CARBON_COEFFICIENTS.length, 'script DB catalog length mismatch');
assert.deepEqual(
  DB_CARBON_COEFFICIENTS.map(c => [c.category, c.subcategory, c.factor, c.source_version]),
  CARBON_COEFFICIENTS.map(c => [c.category, c.subcategory, c.factor, c.sourceVersion]),
  'script DB catalog should be adapted from the shared browser catalog',
);

for (const c of DB_CARBON_COEFFICIENTS) {
  const stmts = carbonCoefficientSyncStatements(c);
  assert.equal(stmts.length, 3, 'coefficient sync should deactivate stale rows, ensure current row, and close duplicates');
  assert.ok(stmts[0].sql.includes('effective_to = datetime'), 'sync should close stale active rows');
  assert.ok(stmts[1].sql.includes('source_version'), 'sync should persist source_version');
  assert.ok(stmts[2].sql.includes('id NOT IN'), 'sync should collapse duplicate active rows');
}

assert.equal(
  estimateCarbonFromCatalog({ category: 'BOOKS', estimatedWeightKg: 1 }).estimatedCarbonSavedKg,
  0.9,
  'BOOKS estimate should use shared catalog',
);

assert.equal(
  estimateCarbonFromCatalog({ category: 'FOOD', foodInfo: { foodType: 'MEAT', weightKg: 1 } }).estimatedCarbonSavedKg,
  8,
  'FOOD/MEAT estimate should use shared catalog',
);

assert.equal(
  estimateCarbonFromCatalog({ category: 'DORM', estimatedWeightKg: 0.35 }).estimatedCarbonSavedKg,
  0.7,
  'shared estimates should use one-decimal rounding',
);

console.log(`carbon coefficient parity passed (${CARBON_COEFFICIENTS.length} coefficients)`);
