import { execute, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/admin/listings/:id/remove' };

export default async function handler(req, context) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'PUT') return error('Method not allowed', 405, req);

  const user = await getAuthUser(req, queryOne);
  if (!user) return error('Unauthorized', 401, req);
  if (user.role !== 'ADMIN') return error('Forbidden: Admin access required', 403, req);

  const listingId = context?.params?.id || (() => {
    const parts = new URL(req.url).pathname.split('/');
    return parts[parts.indexOf('listings') + 1];
  })();
  if (!listingId) return error('Listing ID is required', 400, req);

  try {
    await execute(
      "UPDATE listings SET status = 'REMOVED', updated_at = datetime('now') WHERE id = ?",
      [listingId]
    );
    return json({ success: true, id: listingId, removed: true }, 200, req);
  } catch (err) {
    console.error('Admin remove listing error:', err);
    return error('Internal server error', 500, req);
  }
}
