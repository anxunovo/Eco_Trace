import { getDb, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/user/switch' };

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return cors(request);
  }

  if (request.method !== 'POST') {
    return error('Method not allowed', 405, request);
  }

  try {
    const user = await getAuthUser(request, queryOne);
    if (!user) return error('Unauthorized', 401, request);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return error('Invalid JSON payload', 400, request);
    }

    const { userId } = body;
    if (!userId) {
      return error('userId is required', 400, request);
    }
    if (user.id !== userId && user.role !== 'ADMIN') {
      return error('Forbidden', 403, request);
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, nickname, avatar, school, campus, role, eco_points as ecoPoints, contact_method as contactMethod, contact_value as contactValue FROM users WHERE id = ?',
      args: [userId]
    });

    if (result.rows.length === 0) {
      return error('User not found', 404, request);
    }

    // In a real app, we might set a cookie or return a new JWT here.
    // For this MVP, we just validate the user exists and return the profile.
    return json({ success: true, data: result.rows[0] }, 200, request);

  } catch (err) {
    console.error('Error switching user:', err);
    return error('Internal Server Error', 500, request);
  }
}
