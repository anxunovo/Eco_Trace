import { queryOne, execute } from './_lib/db.js';
import { ok, badRequest, notFound, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/listings/delete' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'DELETE') return methodNotAllowed(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return badRequest('Missing id', req);

    const existing = await queryOne(
      'SELECT owner_id FROM listings WHERE id = ?', [id]
    );
    if (!existing) return notFound('Not found', req);
    if (existing.owner_id !== user.id) return badRequest('Not owner', req);

    await execute("UPDATE listings SET status = 'REMOVED', updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]);

    return ok({ id, deleted: true }, req);
  } catch (err) {
    console.error('Listing delete error:', err);
    return badRequest('Failed to delete listing', req);
  }
}
