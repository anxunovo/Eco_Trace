const BASE = process.argv[2] || 'http://localhost:8888';
let passed = 0;
let failed = 0;
let authToken = null;
let testListingId = null;

function ok(msg) { passed++; console.log(`  ✓ ${msg}`); }
function fail(msg, detail) { failed++; console.log(`  ✗ ${msg}${detail ? ` — ${detail}` : ''}`); }

async function test(method, path, opts = {}) {
  const start = Date.now();
  try {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${BASE}${path}`, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: AbortSignal.timeout(15000) });
    const ms = Date.now() - start;
    let body = null;
    try { body = await res.json(); } catch {}
    return { status: res.status, body, ms };
  } catch (err) {
    return { status: 0, body: null, ms: Date.now() - start, error: err.message };
  }
}

console.log(`\nSmoke test: ${BASE}\n`);

// ---- CORS ----
console.log('--- CORS Preflight ---');
for (const ep of ['/api/listings', '/api/listing', '/api/listings/create', '/api/dashboard', '/api/auth/register']) {
  const r = await test('OPTIONS', ep);
  if (r.status === 204 && r.error === undefined) ok(`OPTIONS ${ep} → 204`);
  else fail(`OPTIONS ${ep}`, `got ${r.status} ${r.error || ''}`);
}

// ---- Public GET ----
console.log('\n--- Public GET ---');
{
  const r = await test('GET', '/api/listings');
  if (r.body?.listings?.length >= 15 && r.body.total >= 15) ok(`GET /api/listings → ${r.body.total} listings (${r.ms}ms)`);
  else fail(`GET /api/listings`, `status=${r.status} total=${r.body?.total} err=${r.error || ''}`);
}

{
  const r = await test('GET', '/api/listings?category=BOOKS');
  if (r.body?.listings?.every(l => l.category === 'BOOKS')) ok(`GET /api/listings?category=BOOKS → ${r.body.listings.length} items`);
  else fail('GET /api/listings?category=BOOKS', `got ${r.body?.listings?.length} items`);
}

{
  const r = await test('GET', '/api/listings?q=矿泉水');
  if (r.body?.listings?.length > 0) ok(`GET /api/listings?q=矿泉水 → ${r.body.listings.length} results`);
  else fail('GET /api/listings?q=矿泉水', `no results`);
}

{
  const r = await test('GET', '/api/listing?id=l_001');
  if (r.body?.listing?.title && r.body.listing.owner?.nickname) ok(`GET /api/listing?id=l_001 → "${r.body.listing.title}" by ${r.body.listing.owner.nickname}`);
  else fail('GET /api/listing?id=l_001', `status=${r.status}`);
}

{
  const r = await test('GET', '/api/listing?id=nonexistent');
  if (r.status === 404) ok('GET /api/listing?id=nonexistent → 404');
  else fail('GET /api/listing?id=nonexistent', `got ${r.status}`);
}

{
  const r = await test('GET', '/api/users');
  if (r.body?.data?.length >= 5) ok(`GET /api/users → ${r.body.data.length} users`);
  else fail('GET /api/users', `got ${r.body?.data?.length}`);
}

{
  const r = await test('GET', '/api/carbon/stats');
  if (r.status === 200 && typeof r.body?.totalCarbonSavedKg === 'number') ok(`GET /api/carbon/stats → ${r.body.totalCarbonSavedKg} kg`);
  else fail('GET /api/carbon/stats', `status=${r.status}`);
}

{
  const r = await test('GET', '/api/dashboard');
  if (r.status === 200 && typeof r.body?.data?.totalCarbonSaved === 'number') ok(`GET /api/dashboard → ${r.body.data.totalCarbonSaved} kg total`);
  else fail('GET /api/dashboard', `status=${r.status}`);
}

// ---- Auth ----
console.log('\n--- Authentication ---');
{
  const r = await test('POST', '/api/auth/register', { body: { nickname: `test_${Date.now()}`, password: 'test1234' } });
  if (r.body?.token && r.body?.user?.id) {
    authToken = r.body.token;
    ok(`POST /api/auth/register → token + user ${r.body.user.id}`);
  } else {
    fail('POST /api/auth/register', `status=${r.status} ${JSON.stringify(r.body)}`);
  }
}

{
  const r = await test('GET', '/api/auth/me');
  if (r.body?.user?.nickname) ok(`GET /api/auth/me → ${r.body.user.nickname}`);
  else fail('GET /api/auth/me', `status=${r.status} ${r.error || ''}`);
}

{
  const r = await test('GET', '/api/user/profile');
  if (r.status === 200) ok('GET /api/user/profile → 200');
  else fail('GET /api/user/profile', `status=${r.status}`);
}

// ---- Listing CRUD ----
console.log('\n--- Listing CRUD ---');
{
  const r = await test('POST', '/api/listings/create', {
    body: {
      title: '烟雾测试物品',
      description: '自动化测试创建',
      category: 'BOOKS',
      tradeMode: 'FREE',
      condition: 'GOOD',
      campus: '北区',
      locationText: '测试地点',
      images: [],
      isFood: false,
      tags: [],
      estimatedWeightKg: 0.5,
    },
  });
  if (r.body?.id && typeof r.body?.estimatedCarbonSavedKg === 'number') {
    testListingId = r.body.id;
    ok(`POST /api/listings/create → id=${testListingId}, carbon=${r.body.estimatedCarbonSavedKg} kg`);
  } else {
    fail('POST /api/listings/create', `status=${r.status} ${JSON.stringify(r.body)?.slice(0, 200)}`);
  }
}

if (testListingId) {
  {
    const r = await test('PUT', `/api/listings/update?id=${testListingId}`, {
      body: { title: '烟雾测试物品(已编辑)' },
    });
    if (r.body?.updated) ok(`PUT /api/listings/update → updated`);
    else fail('PUT /api/listings/update', `status=${r.status}`);
  }

  {
    const r = await test('POST', `/api/listings/${testListingId}/complete`);
    if (r.body?.message && r.body?.carbon_record) ok(`POST /complete → ${r.body.message}, points=${r.body.points_earned}`);
    else fail(`POST /complete`, `status=${r.status} ${JSON.stringify(r.body)?.slice(0, 200)}`);
  }

  // Create another for delete test
  const create2 = await test('POST', '/api/listings/create', {
    body: {
      title: '待删除测试物品', description: '', category: 'DORM', tradeMode: 'FREE',
      condition: 'FAIR', campus: '南区', locationText: '测试', images: [], isFood: false, tags: [],
    },
  });
  if (create2.body?.id) {
    const del = await test('DELETE', `/api/listings/delete?id=${create2.body.id}`);
    if (del.body?.deleted) ok(`DELETE /api/listings/delete → removed`);
    else fail('DELETE /api/listings/delete', `status=${del.status}`);
  }
}

// ---- Interests ----
console.log('\n--- Interests ---');
{
  const r = await test('POST', '/api/interests?listingId=l_001', { body: { listingId: 'l_001', message: '测试意向' } });
  if (r.body?.id) ok(`POST /api/interests → ${r.body.id}`);
  else fail('POST /api/interests', `status=${r.status}`);
}

{
  const r = await test('GET', '/api/interests?listingId=l_001');
  if (r.body?.interests?.length > 0) ok(`GET /api/interests → ${r.body.interests.length} interests`);
  else fail('GET /api/interests', `status=${r.status}`);
}

// ---- Login ----
console.log('\n--- Login (seed user) ---');
{
  const r = await test('POST', '/api/auth/login', { body: { nickname: '李小雨', password: 'demo1234' } });
  if (r.body?.token && r.body?.user) ok(`POST /api/auth/login → ${r.body.user.nickname} logged in`);
  else fail('POST /api/auth/login (李小雨)', `status=${r.status} ${JSON.stringify(r.body)?.slice(0, 200)}`);
}

// ---- Summary ----
console.log(`\n${'='.repeat(40)}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
if (failed > 0) process.exit(1);
