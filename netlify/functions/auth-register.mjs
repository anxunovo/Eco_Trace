import { query, queryOne, execute } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { hashPassword, generateToken, sessionExpiresAt } from './_lib/auth.js';
import crypto from 'crypto';

export const config = { path: '/api/auth/register' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return error('Method not allowed', 405, req);

  try {
    const body = await req.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return error('昵称和密码不能为空', 400, req);
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return error('昵称长度 2-20 个字符', 400, req);
    }
    if (password.length < 8) {
      return error('密码至少 8 位', 400, req);
    }

    const existing = await queryOne(
      'SELECT id FROM users WHERE nickname = ?',
      [nickname]
    );
    if (existing) {
      return error('该昵称已被注册', 409, req);
    }

    const id = 'u_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = hashPassword(password);

    await execute(
      `INSERT INTO users (id, nickname, password_hash, school, campus, role) VALUES (?, ?, ?, '汕头大学', '东海岸校区', 'STUDENT')`,
      [id, nickname, passwordHash]
    );

    const token = generateToken();
    const expiresAt = sessionExpiresAt();
    await execute(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
      ['sess_' + crypto.randomBytes(4).toString('hex'), id, token, expiresAt]
    );

    const user = await queryOne(
      'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users WHERE id = ?',
      [id]
    );

    return json({ success: true, token, user }, 201, req);
  } catch (err) {
    console.error('Register error:', err);
    return error('注册失败', 500, req);
  }
}
