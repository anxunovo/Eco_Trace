import { query, execute, queryOne } from './_lib/db.js';
import { ok, created, badRequest, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/interests' };

function generateId() {
  return 'i_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);
    const url = new URL(req.url);
    const listingId = url.searchParams.get('listingId');

    if (req.method === 'GET') {
      if (!listingId) return badRequest('Missing listingId', req);
      const rows = await query(
        `SELECT i.id, i.user_id, i.message, i.created_at, u.nickname, u.avatar
         FROM interests i LEFT JOIN users u ON i.user_id = u.id
         WHERE i.listing_id = ? ORDER BY i.created_at DESC`,
        [listingId]
      );
      const items = rows.rows.map(r => ({
        id: r.id, userId: r.user_id, message: r.message, createdAt: r.created_at,
        user: { nickname: r.nickname, avatar: r.avatar },
      }));
      return ok({ interests: items }, req);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { listingId: bodyListingId, message } = body;
      const lid = listingId || bodyListingId;
      if (!lid) return badRequest('Missing listingId', req);

      const id = generateId();
      await execute(
        'INSERT INTO interests (id, listing_id, user_id, message, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, lid, user.id, message || '', new Date().toISOString()]
      );
      await execute(
        'UPDATE listings SET interested_count = interested_count + 1 WHERE id = ?',
        [lid]
      );
      return created({ id }, req);
    }

    return methodNotAllowed(req);
  } catch (err) {
    console.error('Interests error:', err);
    return badRequest('Failed to process interests', req);
  }
}
