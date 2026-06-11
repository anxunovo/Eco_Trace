import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'new-site', 'public');
const PORT = Number(process.env.PORT || process.argv[2] || 8099);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function safePublicPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const target = path.resolve(PUBLIC, relativePath);
  return target.startsWith(PUBLIC) ? target : null;
}

async function resolveStaticFile(urlPath) {
  const target = safePublicPath(urlPath);
  if (!target) return null;
  try {
    const info = await stat(target);
    if (info.isFile()) return target;
  } catch {}
  return path.join(PUBLIC, 'index.html');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname.startsWith('/api/')) {
    sendText(res, 404, JSON.stringify({ error: 'Static demo mode: API disabled' }), 'application/json; charset=utf-8');
    return;
  }

  const file = await resolveStaticFile(url.pathname);
  if (!file) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`EcoTrace static demo: http://127.0.0.1:${PORT}/demo`);
  console.log('API is intentionally disabled; the app will use local seed data.');
});
