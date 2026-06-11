import { queryOne, execute } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { verifyPassword, generateToken, sessionExpiresAt } from './_lib/auth.js';
import crypto from 'crypto';

export const config = { path: '/api/auth/login' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return error('Method not allowed', 405, req);

  try {
    const body = await req.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return error('昵称和密码不能为空', 400, req);
    }

    const user = await queryOne(
      'SELECT id, nickname, password_hash, avatar, school, campus, role, eco_points FROM users WHERE nickname = ?',
      [nickname]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return error('昵称或密码错误', 401, req);
    }

    const token = generateToken();
    const expiresAt = sessionExpiresAt();
    await execute(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
      ['sess_' + crypto.randomBytes(4).toString('hex'), user.id, token, expiresAt]
    );

    const { password_hash, ...safeUser } = user;
    return json({ success: true, token, user: safeUser }, 200, req);
  } catch (err) {
    console.error('Login error:', err);
    return error('登录失败', 500, req);
  }
}
