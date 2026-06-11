import { query, queryOne, execute } from './_lib/db.js';
import { json, error, cors, methodNotAllowed } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/admin/expire-food' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return methodNotAllowed(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) {
      return error('Unauthorized', 401, req);
    }
    if (user.role !== 'ADMIN') {
      return error('Forbidden: Admin access required', 403, req);
    }

    const { rows: activeFoodListings } = await query(
      `SELECT id, food_info FROM listings WHERE category = 'FOOD' AND status = 'ACTIVE'`
    );

    const now = new Date();
    const expiredIds = [];

    for (const listing of activeFoodListings) {
      if (!listing.food_info) continue;
      try {
        const foodInfo = JSON.parse(listing.food_info);
        const expiry = foodInfo.expireAt || foodInfo.latestPickupTime;
        if (expiry && new Date(expiry) < now) {
          expiredIds.push(listing.id);
        }
      } catch { /* skip malformed food_info */ }
    }

    let expiredCount = 0;
    for (const id of expiredIds) {
      await execute(
        `UPDATE listings SET status = 'EXPIRED' WHERE id = ?`,
        [id]
      );
      expiredCount++;
    }

    console.log(`Manual trigger: Expired ${expiredCount} food items.`);

    return json({ expired_count: expiredCount, expired_ids: expiredIds }, 200, req);
  } catch (err) {
    console.error('Error in admin-expire-food:', err);
    return error('Internal server error', 500, req);
  }
}
