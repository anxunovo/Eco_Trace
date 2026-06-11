import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'new-site', 'public');

let passed = 0;
let failed = 0;

function pass(message) {
  passed += 1;
  console.log(`  ok ${message}`);
}

function fail(message, error) {
  failed += 1;
  console.log(`  fail ${message}${error ? ` - ${error.message || error}` : ''}`);
}

async function test(message, fn) {
  try {
    await fn();
    pass(message);
  } catch (error) {
    fail(message, error);
  }
}

function ensureFile(relPath) {
  const target = path.join(PUBLIC, relPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(target), `${relPath} is missing`);
}

function nodeCheck(relPath) {
  const target = path.join(ROOT, relPath);
  const result = spawnSync(process.execPath, ['--check', target], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function exportedNames(source) {
  const names = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s+let\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s+var\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const block of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of block[1].split(',')) {
      const clean = part.trim();
      if (!clean) continue;
      const alias = clean.split(/\s+as\s+/).pop().trim();
      if (alias) names.add(alias);
    }
  }
  return names;
}

function importedRelativeNamedExports(source) {
  const imports = [];
  for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    imports.push({
      names: match[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean),
      specifier: match[2],
    });
  }
  return imports;
}

function checkNamedImports(relPath) {
  const target = path.join(ROOT, relPath);
  const source = fs.readFileSync(target, 'utf8');
  for (const item of importedRelativeNamedExports(source)) {
    const importedFile = path.resolve(path.dirname(target), item.specifier.split('?')[0]);
    const candidates = importedFile.endsWith('.js') ? [importedFile] : [`${importedFile}.js`, path.join(importedFile, 'index.js')];
    const resolved = candidates.find(candidate => fs.existsSync(candidate));
    assert.ok(resolved, `${relPath} imports missing module ${item.specifier}`);
    const exports = exportedNames(fs.readFileSync(resolved, 'utf8'));
    for (const name of item.names) {
      assert.ok(exports.has(name), `${relPath} imports ${name} from ${item.specifier}, but it is not exported`);
    }
  }
}

console.log('\nLocal demo smoke test\n');

await test('static entry files exist', () => {
  [
    '/index.html',
    '/manifest.json',
    '/sw.js',
    '/assets/app.js',
    '/assets/store.js',
    '/assets/seed.js',
    '/assets/pages/home.js',
    '/assets/pages/demo.js',
    '/assets/pages/publish.js',
    '/assets/pages/listings.js',
    '/assets/pages/listing-detail.js',
    '/assets/pages/impact.js',
    '/assets/pages/carbon-report.js',
  ].forEach(ensureFile);
});

await test('service worker precache files all exist', () => {
  const sw = fs.readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8');
  const match = sw.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/);
  assert.ok(match, 'STATIC_ASSETS list not found');
  const assets = [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
  assert.ok(assets.length > 10, 'precache list is unexpectedly small');
  assets.filter(asset => asset !== '/').forEach(ensureFile);
});

await test('key browser modules pass syntax check', () => {
  [
    'new-site/public/sw.js',
    'new-site/public/assets/app.js',
    'new-site/public/assets/store.js',
    'new-site/public/assets/api-adapter.js',
    'new-site/public/assets/components.js',
    'new-site/public/assets/share-card.js',
    'scripts/static-demo.mjs',
    'new-site/public/assets/pages/home.js',
    'new-site/public/assets/pages/demo.js',
    'new-site/public/assets/pages/auth.js',
    'new-site/public/assets/pages/publish.js',
    'new-site/public/assets/pages/listings.js',
    'new-site/public/assets/pages/listing-detail.js',
    'new-site/public/assets/pages/impact.js',
    'new-site/public/assets/pages/carbon-report.js',
  ].forEach(nodeCheck);
});

await test('relative named imports match exported names', () => {
  [
    'new-site/public/assets/app.js',
    'new-site/public/assets/store.js',
    'new-site/public/assets/components.js',
    'new-site/public/assets/pages/home.js',
    'new-site/public/assets/pages/demo.js',
    'new-site/public/assets/pages/auth.js',
    'new-site/public/assets/pages/carbon-report.js',
  ].forEach(checkNamedImports);
});

await test('seed data supports a complete competition demo', async () => {
  const seed = await import(pathToFileURL(path.join(PUBLIC, 'assets', 'seed.js')).href);
  assert.ok(seed.SEED_USERS.length >= 3, 'need at least three demo users');
  assert.ok(seed.SEED_LISTINGS.length >= 12, 'need enough demo listings');
  assert.ok(seed.SEED_LISTINGS.some(item => item.status === 'COMPLETED'), 'need completed listing examples');
  assert.ok(seed.SEED_LISTINGS.some(item => item.isFood), 'need food sharing examples');
  assert.ok(seed.SEED_LISTINGS.some(item => item.tradeMode === 'FREE'), 'need free transfer examples');
  assert.ok(seed.SEED_LISTINGS.some(item => item.tradeMode === 'SWAP'), 'need swap examples');
});

await test('share card controller unit test passes', () => {
  const result = spawnSync(process.execPath, ['tests/share-card.test.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
