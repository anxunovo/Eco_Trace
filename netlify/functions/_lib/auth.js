import crypto from 'crypto';

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const TOKEN_BYTES = 32;
const SESSION_DAYS = 7;

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [iter, salt, hash] = stored.split(':');
  if (!iter || !salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, parseInt(iter), 64, 'sha512').toString('hex');
  return hash === verify;
}

export function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function sessionExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString();
}

function legacyUserHeaderEnabled() {
  return process.env.ALLOW_LEGACY_USER_HEADER === 'true' || process.env.NETLIFY_DEV === 'true';
}

export function getBearerToken(req) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// Legacy demo identity. Disabled in production unless explicitly enabled.
export function getUser(req) {
  if (!legacyUserHeaderEnabled()) return null;
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return { id: userId, role: 'STUDENT' };
}

// Async: resolve authenticated user from Bearer token, with optional local demo header.
export async function getAuthUser(req, queryOne) {
  const token = getBearerToken(req);
  if (token) {
    const session = await queryOne(
      `SELECT s.user_id FROM sessions s WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`,
      [token]
    );
    if (session) {
      const user = await queryOne(
        'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users WHERE id = ?',
        [session.user_id]
      );
      if (user) return user;
    }
    return null;
  }

  if (legacyUserHeaderEnabled()) {
    const legacyUserId = req.headers.get('x-user-id');
    if (legacyUserId) {
      return queryOne(
        'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users WHERE id = ?',
        [legacyUserId]
      );
    }
  }
  return null;
}
