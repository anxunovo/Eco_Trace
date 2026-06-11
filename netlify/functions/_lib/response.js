function normalizeOrigin(origin) {
  if (!origin) return '';
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
}

const ENV_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  ...ENV_ORIGINS,
  process.env.SITE_URL,
  process.env.DEPLOY_URL,
  process.env.DEPLOY_PRIME_URL,
  process.env.URL,
  'https://stu-eco-trace.netlify.app',
  'http://localhost:8888',
  'http://localhost:3000',
].map(normalizeOrigin).filter(Boolean);

function getCorsOrigin(origin) {
  if (!origin) return '';
  const normalizedOrigin = normalizeOrigin(origin);
  return ALLOWED_ORIGINS.includes(normalizedOrigin) ? normalizedOrigin : '';
}

export function json(data, status = 200, req) {
  const origin = getCorsOrigin(req?.headers?.get('origin'));
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(origin && {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
      }),
    },
  });
}

export function ok(data, req) { return json(data, 200, req); }
export function created(data, req) { return json(data, 201, req); }

export function badRequest(message, req) { return json({ error: message }, 400, req); }
export function notFound(message = 'Not found', req) { return json({ error: message }, 404, req); }
export function methodNotAllowed(req) { return json({ error: 'Method Not Allowed' }, 405, req); }
export function error(message, status = 500, req) { return json({ error: message }, status, req); }

export function cors(req) {
  const origin = getCorsOrigin(req?.headers?.get('origin'));
  return new Response(null, {
    status: 204,
    headers: origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    } : {},
  });
}
