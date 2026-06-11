const TURSO_URL = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://');
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
import {
  DB_CARBON_COEFFICIENTS,
  carbonCoefficientSyncStatements,
} from './lib/carbon-coefficients.mjs';

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars');
  process.exit(1);
}

async function batch(statements) {
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statements: statements.map(s => ({
        q: typeof s === 'string' ? s : s.sql,
        params: typeof s === 'string' ? [] : (s.args || []),
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function run(sql, args = []) {
  const data = await batch([{ sql, args }]);
  if (data[0]?.error) throw new Error(`Turso: ${JSON.stringify(data[0].error)}`);
  return data[0];
}

// ---------- Users ----------
import crypto from 'crypto';

const SALT_LENGTH = 16;
const ITERATIONS = 100000;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

const DEMO_PASSWORD = 'demo1234';

const USERS = [
  { id: 'u_alice', nickname: 'Alice', avatar: '', school: '碳循大学', campus: '北区', role: 'STUDENT' },
  { id: 'u_bob', nickname: 'Bob', avatar: '', school: '碳循大学', campus: '北区', role: 'STUDENT' },
  { id: 'u_grad', nickname: '学长小李', avatar: '', school: '碳循大学', campus: '北区', role: 'STUDENT' },
  { id: 'u_club', nickname: '绿色社团', avatar: '', school: '碳循大学', campus: '中心校区', role: 'STUDENT' },
  { id: 'u_admin', nickname: '管理员', avatar: '', school: '碳循大学', campus: '', role: 'ADMIN' },
];

console.log(`Inserting ${USERS.length} users (with password_hash)...`);
const userStmts = USERS.map(u => ({
  sql: `INSERT OR IGNORE INTO users (id, nickname, password_hash, avatar, school, campus, role, eco_points) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  args: [u.id, u.nickname, hashPassword(DEMO_PASSWORD), u.avatar, u.school, u.campus, u.role],
}));
await batch(userStmts);
console.log(`  done (all passwords: ${DEMO_PASSWORD})`);

// ---------- Carbon Coefficients ----------
const COEFFICIENTS = DB_CARBON_COEFFICIENTS;

console.log(`Inserting ${COEFFICIENTS.length} carbon coefficients...`);
const coeffStmts = COEFFICIENTS.flatMap(carbonCoefficientSyncStatements);
await batch(coeffStmts);
console.log(`  done`);

// ---------- Listings ----------
const now = Date.now();
const hAgo = h => new Date(now - h * 3600000).toISOString();
const hLater = h => new Date(now + h * 3600000).toISOString();
const IMG = n => '/assets/seed-images/' + n;

const listings = [
  { id:'l_001', oid:'u_alice', title:'九成新高等数学教材', desc:'高等数学（上册），适合低年级同学复习使用', cat:'BOOKS', imgs:[IMG('books_1.jpg'),IMG('books_3.jpg')], tm:'SALE', price:12, cond:'GOOD', campus:'北区', loc:'北区图书馆门口', cm:'微信', cv:'demo_alice', wKg:0.8, cKg:0.7, conf:0.82, asmp:['判断为纸质教材','按单本教材约0.8kg估算'], food:false, fi:null, ic:3, tags:[], st:'ACTIVE', h:2 },
  { id:'l_006', oid:'u_bob', title:'线性代数复习资料（活页）', desc:'手写整理的期末复习讲义', cat:'BOOKS', imgs:[IMG('books_2.jpg')], tm:'FREE', price:0, cond:'GOOD', campus:'中心校区', loc:'教学楼A大厅', cm:'QQ', cv:'10000002', wKg:0.3, cKg:0.5, conf:0.8, asmp:['纸质学习资料'], food:false, fi:null, ic:12, tags:[], st:'ACTIVE', h:40 },
  { id:'l_013', oid:'u_grad', title:'经济学原理（曼昆，第七版）', desc:'经管院专业教材，几乎全新', cat:'BOOKS', imgs:[IMG('books_4.jpg')], tm:'SALE', price:25, cond:'LIKE_NEW', campus:'北区', loc:'北区图书馆门口', cm:'微信', cv:'demo_grad', wKg:1.2, cKg:1.1, conf:0.85, asmp:['判断为大本教材'], food:false, fi:null, ic:6, tags:['GRAD'], st:'ACTIVE', h:8 },
  { id:'l_014', oid:'u_alice', title:'古代汉语词典（缩印本）', desc:'用了一学期，外皮有点折痕', cat:'BOOKS', imgs:[IMG('books_5.jpg')], tm:'SALE', price:18, cond:'GOOD', campus:'北区', loc:'南区图书馆', cm:'微信', cv:'demo_alice', wKg:0.9, cKg:0.8, conf:0.79, asmp:['判断为词典'], food:false, fi:null, ic:1, tags:[], st:'ACTIVE', h:15 },
  { id:'l_002', oid:'u_bob', title:'宿舍收纳盒三件套', desc:'毕业清理，三个不同大小的收纳盒', cat:'DORM', imgs:[IMG('dorm_1.jpg'),IMG('dorm_3.jpg')], tm:'FREE', price:0, cond:'GOOD', campus:'北区', loc:'3号宿舍楼下', cm:'微信', cv:'demo_bob', wKg:2.0, cKg:4.2, conf:0.74, asmp:['塑料收纳'], food:false, fi:null, ic:5, tags:['GRAD'], st:'ACTIVE', h:5 },
  { id:'l_005', oid:'u_grad', title:'毕业季衣架一包（约20个）', desc:'塑料衣架，有少量使用痕迹', cat:'DORM', imgs:[IMG('dorm_2.jpg')], tm:'FREE', price:0, cond:'FAIR', campus:'北区', loc:'5号宿舍楼下', cm:'站内留言', cv:'', wKg:1.0, cKg:2.1, conf:0.7, asmp:['塑料衣架'], food:false, fi:null, ic:7, tags:['GRAD'], st:'ACTIVE', h:30 },
  { id:'l_010', oid:'u_bob', title:'可交换马克杯一个', desc:'纯白陶瓷马克杯，想换一杯奶茶', cat:'DORM', imgs:[IMG('mug_1.jpg'),IMG('mug_2.jpg')], tm:'SWAP', price:null, cond:'LIKE_NEW', campus:'北区', loc:'南区图书馆', cm:'QQ', cv:'10000002', wKg:0.35, cKg:1.5, conf:0.7, asmp:['马克杯'], food:false, fi:null, ic:2, tags:[], st:'ACTIVE', h:70 },
  { id:'l_016', oid:'u_alice', title:'全新枕芯一对（带防尘袋）', desc:'买多了一对，从未拆封', cat:'DORM', imgs:[IMG('mug_3.jpg')], tm:'SALE', price:35, cond:'NEW', campus:'北区', loc:'北区快递站', cm:'微信', cv:'demo_alice', wKg:1.8, cKg:3.8, conf:0.65, asmp:['寝具'], food:false, fi:null, ic:0, tags:[], st:'ACTIVE', h:20 },
  { id:'l_004', oid:'u_grad', title:'台灯（USB三档亮度）', desc:'用了一年多的USB护眼台灯', cat:'ELECTRONICS', imgs:[IMG('lamp_1.jpg'),IMG('lamp_3.jpg')], tm:'SALE', price:20, cond:'GOOD', campus:'南区', loc:'南区快递站', cm:'微信', cv:'demo_grad', wKg:0.6, cKg:15.0, conf:0.9, asmp:['小型电子台灯'], food:false, fi:null, ic:2, tags:['GRAD'], st:'ACTIVE', h:24 },
  { id:'l_011', oid:'u_grad', title:'闲置无线鼠标', desc:'毕业出闲，USB接收器和电池都在', cat:'ELECTRONICS', imgs:[IMG('mouse_1.jpg')], tm:'SALE', price:15, cond:'GOOD', campus:'北区', loc:'2号教学楼', cm:'微信', cv:'demo_grad', wKg:0.12, cKg:15.0, conf:0.93, asmp:['无线鼠标'], food:false, fi:null, ic:1, tags:['GRAD'], st:'ACTIVE', h:80 },
  { id:'l_017', oid:'u_bob', title:'蓝牙耳机（半入耳，盒子在）', desc:'用了大半年还很新，配件齐全', cat:'ELECTRONICS', imgs:[IMG('earphones_1.jpg'),IMG('earphones_2.jpg')], tm:'SALE', price:60, cond:'LIKE_NEW', campus:'南区', loc:'南区快递站', cm:'微信', cv:'demo_bob', wKg:0.08, cKg:15.0, conf:0.94, asmp:['蓝牙耳机'], food:false, fi:null, ic:4, tags:[], st:'ACTIVE', h:6 },
  { id:'l_009', oid:'u_alice', title:'九成新帆布包（米白色）', desc:'去年买的校园风帆布包', cat:'CLOTHING', imgs:[IMG('bag_1.jpg'),IMG('bag_3.jpg')], tm:'NEGOTIABLE', price:null, cond:'LIKE_NEW', campus:'中心校区', loc:'北区食堂门口', cm:'微信', cv:'demo_alice', wKg:0.4, cKg:5.6, conf:0.86, asmp:['帆布包'], food:false, fi:null, ic:0, tags:[], st:'ACTIVE', h:55 },
  { id:'l_018', oid:'u_grad', title:'校园卫衣M码（灰色）', desc:'只穿过两三次，M码偏大', cat:'CLOTHING', imgs:[IMG('clothes_1.jpg')], tm:'SALE', price:30, cond:'LIKE_NEW', campus:'北区', loc:'5号宿舍楼下', cm:'微信', cv:'demo_grad', wKg:0.55, cKg:5.6, conf:0.83, asmp:['衣物'], food:false, fi:null, ic:2, tags:['GRAD'], st:'ACTIVE', h:12 },
  { id:'l_019', oid:'u_alice', title:'文具套装：多色笔+笔袋+便签', desc:'考研用过一阵子，笔都还有墨水', cat:'STATIONERY', imgs:[IMG('stationery_1.jpg'),IMG('stationery_2.jpg')], tm:'SALE', price:8, cond:'GOOD', campus:'北区', loc:'北区图书馆门口', cm:'站内留言', cv:'', wKg:0.3, cKg:1.4, conf:0.71, asmp:['文具套装'], food:false, fi:null, ic:3, tags:[], st:'ACTIVE', h:4 },
  { id:'l_003', oid:'u_alice', title:'闲置羽毛球拍一把', desc:'用了两学期，想换个瑜伽垫', cat:'SPORTS', imgs:[IMG('sports_racket_1.jpg'),IMG('sports_racket_3.jpg')], tm:'SWAP', price:null, cond:'GOOD', campus:'南区', loc:'体育馆门口', cm:'QQ', cv:'10000001', wKg:0.15, cKg:3.5, conf:0.88, asmp:['羽毛球拍'], food:false, fi:null, ic:1, tags:[], st:'ACTIVE', h:10 },
  { id:'l_020', oid:'u_bob', title:'加厚瑜伽垫（紫色）', desc:'室友买的，没用过两次', cat:'SPORTS', imgs:[IMG('sports_yoga_1.jpg')], tm:'FREE', price:0, cond:'LIKE_NEW', campus:'南区', loc:'体育馆门口', cm:'微信', cv:'demo_bob', wKg:1.2, cKg:3.5, conf:0.82, asmp:['运动用品'], food:false, fi:null, ic:6, tags:[], st:'ACTIVE', h:18 },
  { id:'l_007', oid:'u_club', title:'未开封矿泉水6瓶', desc:'社团活动剩余，全部未开封', cat:'FOOD', imgs:[IMG('food_water_1.jpg'),IMG('food_water_3.jpg')], tm:'FREE', price:0, cond:'NEW', campus:'中心校区', loc:'学生活动中心', cm:'微信', cv:'demo_club', wKg:3.0, cKg:1.2, conf:0.92, asmp:['未开封饮料'], food:true, fi:{foodType:'SNACK',packageStatus:'UNOPENED',weightKg:3.0,servings:6,expireAt:hLater(48),storageNote:'常温储存即可',safetyConfirmed:true}, ic:2, tags:[], st:'ACTIVE', h:1 },
  { id:'l_008', oid:'u_club', title:'社团活动剩余未开封零食', desc:'包含薯片、饼干、糖果等', cat:'FOOD', imgs:[IMG('food_snack_1.jpg'),IMG('food_snack_3.jpg')], tm:'FREE', price:0, cond:'NEW', campus:'中心校区', loc:'大活101', cm:'微信', cv:'demo_club', wKg:1.5, cKg:3.0, conf:0.85, asmp:['零食'], food:true, fi:{foodType:'SNACK',packageStatus:'UNOPENED',weightKg:1.5,servings:10,expireAt:hLater(72),storageNote:'常温阴凉处',safetyConfirmed:true}, ic:4, tags:[], st:'ACTIVE', h:3 },
  { id:'l_012', oid:'u_club', title:'社团水果拼盘剩余未动部分', desc:'小型会议剩余的水果盘', cat:'FOOD', imgs:[IMG('food_fruit_1.jpg'),IMG('food_fruit_3.jpg')], tm:'FREE', price:0, cond:'NEW', campus:'中心校区', loc:'社团办公室', cm:'微信', cv:'demo_club', wKg:1.0, cKg:0.8, conf:0.82, asmp:['果蔬类食物'], food:true, fi:{foodType:'VEG',packageStatus:'COOKED',weightKg:1.0,servings:4,expireAt:hLater(6),storageNote:'已经切好尽快食用',safetyConfirmed:true}, ic:3, tags:[], st:'ACTIVE', h:0.5 },
  { id:'l_021', oid:'u_alice', title:'即将到期纯牛奶4盒（明早过期）', desc:'买多了喝不完，明天到期', cat:'FOOD', imgs:[IMG('food_water_2.jpg')], tm:'FREE', price:0, cond:'NEW', campus:'北区', loc:'3号宿舍楼下', cm:'微信', cv:'demo_alice', wKg:1.0, cKg:8.0, conf:0.88, asmp:['肉蛋奶类'], food:true, fi:{foodType:'MEAT',packageStatus:'UNOPENED',weightKg:1.0,servings:4,expireAt:hLater(14),storageNote:'冷藏保存',safetyConfirmed:true}, ic:5, tags:[], st:'ACTIVE', h:2 },
];

const insertSQL = `INSERT OR IGNORE INTO listings (id, owner_id, title, description, category, trade_mode, price, \`condition\`, campus, location_text, contact_method, contact_value, images, estimated_weight_kg, estimated_carbon_saved_kg, ai_confidence, ai_assumptions, is_food, food_info, tags, interested_count, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

console.log(`Inserting ${listings.length} listings...`);
// Batch in groups of 5 to avoid request size limits
for (let i = 0; i < listings.length; i += 5) {
  const chunk = listings.slice(i, i + 5);
  const stmts = chunk.map(l => ({
    sql: insertSQL,
    args: [
      l.id, l.oid, l.title, l.desc, l.cat, l.tm, l.price, l.cond,
      l.campus, l.loc, l.cm, l.cv, JSON.stringify(l.imgs),
      l.wKg, l.cKg, l.conf, JSON.stringify(l.asmp),
      l.food ? 1 : 0, l.fi ? JSON.stringify(l.fi) : null,
      JSON.stringify(l.tags), l.ic, l.st, hAgo(l.h),
    ],
  }));
  const result = await batch(stmts);
  const errors = result.filter(r => r.error);
  if (errors.length > 0) {
    for (const e of errors) console.error('Error:', e.error);
    process.exit(1);
  }
}
console.log(`  done`);

// ---------- Verify ----------
console.log('\nVerification:');
for (const t of ['users', 'listings', 'carbon_coefficients']) {
  const r = await run(`SELECT COUNT(*) as cnt FROM ${t}`);
  const cols = r.results?.columns || [];
  const rows = r.results?.rows || [];
  console.log(`  ${t}: ${rows[0]?.[0] ?? '?'} rows`);
}

console.log('\nSeed complete.');
