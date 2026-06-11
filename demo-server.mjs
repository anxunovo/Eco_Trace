/**
 * 碳循校园 EcoTrace — 本地演示服务器
 *
 * 零依赖启动：node demo-server.mjs
 * 自动加载 .env、路由 API 请求到 Netlify Functions、托管前端静态文件。
 * 适用于：比赛演示、本地开发、离线评审。
 *
 * 环境要求：Node.js ≥ 18（需要全局 Request/Response）
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

// ─────────────────── .env 加载 ───────────────────
const __dir = fileURLToPath(new URL('.', import.meta.url));

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(join(__dir, '.env'));
loadEnv(join(__dir, '.env.local'));

// ─────────────────── 环境检查 ───────────────────
const required = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'ZHIPUAI_API_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ 缺少环境变量: ${missing.join(', ')}`);
  console.error('   请在 .env 文件中配置后重试。\n');
  process.exit(1);
}

// 标记为本地开发环境（启用 legacy user header 兼容）
process.env.NETLIFY_DEV = 'true';

// ─────────────────── 路由表 ───────────────────
const ROUTES = {
  '/api/auth/register':  () => import('./netlify/functions/auth-register.mjs'),
  '/api/auth/login':     () => import('./netlify/functions/auth-login.mjs'),
  '/api/auth/me':        () => import('./netlify/functions/auth-me.mjs'),
  '/api/listings':       () => import('./netlify/functions/listings.mjs'),
  '/api/listing':        () => import('./netlify/functions/listing-detail.mjs'),
  '/api/listings/create':() => import('./netlify/functions/listing-create.mjs'),
  '/api/listings/update':() => import('./netlify/functions/listing-update.mjs'),
  '/api/listings/delete':() => import('./netlify/functions/listing-delete.mjs'),
  '/api/ai/analyze':     () => import('./netlify/functions/ai-analyze.mjs'),
  '/api/dashboard':      () => import('./netlify/functions/dashboard.mjs'),
  '/api/carbon/stats':   () => import('./netlify/functions/carbon-stats.mjs'),
  '/api/user/profile':   () => import('./netlify/functions/user-profile.mjs'),
  '/api/interests':      () => import('./netlify/functions/interests.mjs'),
  '/api/listing/*/complete': () => import('./netlify/functions/listing-complete.mjs'),
  '/api/admin/listings': () => import('./netlify/functions/admin-listings.mjs'),
  '/api/admin/reset':    () => import('./netlify/functions/admin-reset.mjs'),
};

// 缓存已加载的模块
const moduleCache = new Map();
async function getHandler(pathname) {
  if (moduleCache.has(pathname)) return moduleCache.get(pathname);
  const loader = ROUTES[pathname];
  if (!loader) return null;
  const mod = await loader();
  const entry = { handler: mod.default, config: mod.config };
  moduleCache.set(pathname, entry);
  return entry;
}

// ─────────────────── 静态文件 ───────────────────
const STATIC_ROOT = join(__dir, 'new-site', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let pathname = url.pathname;
  if (pathname === '/') pathname = '/index.html';

  const filePath = join(STATIC_ROOT, pathname);

  // 防止目录遍历
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      // SPA fallback
      const index = join(STATIC_ROOT, 'index.html');
      const data = await readFile(index);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
      return;
    }
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(data);
  } catch {
    // SPA fallback: 所有非文件请求返回 index.html
    try {
      const data = await readFile(join(STATIC_ROOT, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end('Not Found');
    }
  }
}

// ─────────────────── API 路由 ───────────────────
function matchRoute(pathname) {
  // 精确匹配
  if (ROUTES[pathname]) return pathname;
  // /api/listing/{id}/complete
  const m = pathname.match(/^(\/api\/listing\/)[^/]+(\/complete)$/);
  if (m) return '/api/listing/*/complete';
  // /api/admin/listings/{id}/remove
  if (pathname.startsWith('/api/admin/listings/') && pathname.endsWith('/remove'))
    return '/api/admin/listings';
  return null;
}

async function serveApi(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const routePath = matchRoute(url.pathname);

  if (!routePath) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API route not found' }));
    return;
  }

  const entry = await getHandler(routePath);
  if (!entry) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Handler not found' }));
    return;
  }

  // 收集 request body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyRaw = Buffer.concat(chunks).toString();

  // 构建 Web API Request
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }

  const requestInit = {
    method: req.method,
    headers,
  };
  if (bodyRaw && req.method !== 'GET' && req.method !== 'HEAD') {
    requestInit.body = bodyRaw;
  }

  const webReq = new Request(url.href, requestInit);

  try {
    const webRes = await entry.handler(webReq);
    const resBody = await webRes.text();
    const resHeaders = {};
    webRes.headers.forEach((v, k) => { resHeaders[k] = v; });
    res.writeHead(webRes.status, resHeaders);
    res.end(resBody);
  } catch (err) {
    console.error(`API error [${req.method} ${url.pathname}]:`, err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// ─────────────────── 服务器 ───────────────────
const PORT = parseInt(process.env.PORT || '3456', 10);

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');

  // API 路由
  if (url.pathname.startsWith('/api/')) {
    await serveApi(req, res);
    return;
  }

  // 静态文件
  await serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │                                              │');
  console.log('  │   🌿 碳循校园 EcoTrace — 本地演示服务器     │');
  console.log('  │                                              │');
  console.log('  │   http://localhost:' + PORT + '                     │');
  console.log('  │                                              │');
  console.log('  │   API:   Turso DB + ZhipuAI (实时)           │');
  console.log('  │   前端:  Vue 3 SPA (本地静态)                │');
  console.log('  │                                              │');
  console.log('  │   Ctrl+C 停止                                │');
  console.log('  │                                              │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');

  // 尝试打开浏览器
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  import('node:child_process').then(cp => {
    cp.exec(`${cmd} http://localhost:${PORT}`, () => {});
  }).catch(() => {});
});
