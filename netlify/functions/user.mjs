import { getDb, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/user' };

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return cors(request);
  }

  const user = await getAuthUser(request, queryOne);
  if (!user) return error('Unauthorized', 401, request);
  const userId = user.id;

  const db = getDb();

  if (request.method === 'GET') {
    try {
      const result = await db.execute({
        sql: 'SELECT id, nickname, avatar, school, campus, role, eco_points as ecoPoints, contact_method as contactMethod, contact_value as contactValue FROM users WHERE id = ?',
        args: [userId]
      });

      if (result.rows.length === 0) {
        return error('User not found', 404, request);
      }

      return json({ success: true, data: result.rows[0] }, 200, request);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return error('Internal Server Error', 500, request);
    }
  }

  if (request.method === 'PUT') {
    try {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return error('Invalid JSON payload', 400, request);
      }

      const { nickname, avatar, school, campus, contactMethod, contactValue } = body;

      const updates = [];
      const args = [];

      if (nickname !== undefined) { updates.push('nickname = ?'); args.push(nickname); }
      if (avatar !== undefined) { updates.push('avatar = ?'); args.push(avatar); }
      if (school !== undefined) { updates.push('school = ?'); args.push(school); }
      if (campus !== undefined) { updates.push('campus = ?'); args.push(campus); }
      if (contactMethod !== undefined) { updates.push('contact_method = ?'); args.push(contactMethod); }
      if (contactValue !== undefined) { updates.push('contact_value = ?'); args.push(contactValue); }

      if (updates.length === 0) {
        return json({ success: true, message: 'No updates provided' }, 200, request);
      }

      updates.push("updated_at = datetime('now')");
      args.push(userId);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ? RETURNING id, nickname, avatar, school, campus, role, eco_points as ecoPoints, contact_method as contactMethod, contact_value as contactValue`;

      const result = await db.execute({
        sql: query,
        args: args
      });

      if (result.rows.length === 0) {
        return error('User not found', 404, request);
      }

      return json({ success: true, data: result.rows[0] }, 200, request);

    } catch (err) {
      console.error('Error updating user profile:', err);
      return error('Internal Server Error', 500, request);
    }
  }

  return error('Method not allowed', 405, request);
}
