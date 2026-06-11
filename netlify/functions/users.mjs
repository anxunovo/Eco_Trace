import { query } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';

export const config = { path: '/api/users' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return error('Method not allowed', 405, req);

  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role');

    const sql = role
      ? 'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users WHERE role = ?'
      : 'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users';
    const { rows } = await query(sql, role ? [role] : []);

    return json({ success: true, data: rows }, 200, req);
  } catch (err) {
    console.error('Users GET error:', err);
    return error('Internal Server Error', 500, req);
  }
}
