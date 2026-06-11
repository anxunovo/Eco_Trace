import { queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getBearerToken } from './_lib/auth.js';

export const config = { path: '/api/auth/me' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return error('Method not allowed', 405, req);

  try {
    const token = getBearerToken(req);
    if (!token) return error('未登录', 401, req);

    const session = await queryOne(
      `SELECT s.user_id FROM sessions s WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`,
      [token]
    );
    if (!session) return error('登录已过期', 401, req);

    const user = await queryOne(
      'SELECT id, nickname, avatar, school, campus, role, eco_points, contact_method, contact_value FROM users WHERE id = ?',
      [session.user_id]
    );
    if (!user) return error('用户不存在', 404, req);

    return json({ success: true, user }, 200, req);
  } catch (err) {
    console.error('Auth me error:', err);
    return error('认证失败', 500, req);
  }
}
