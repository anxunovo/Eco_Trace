import { query, execute } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';

export const config = { path: '/api/listings/check-expiry' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return error('Method not allowed', 405, req);

  try {
    const { rows: activeFoodListings } = await query(
      `SELECT id, food_info FROM listings WHERE is_food = 1 AND status = 'ACTIVE'`
    );

    const now = new Date();
    const expiredIds = [];

    for (const listing of activeFoodListings) {
      if (!listing.food_info) continue;
      try {
        const foodInfo = JSON.parse(listing.food_info);
        const expiry = foodInfo.latestPickupTime || foodInfo.expireAt;
        if (expiry && new Date(expiry) < now) {
          expiredIds.push(listing.id);
        }
      } catch { /* skip malformed food_info */ }
    }

    let expiredCount = 0;
    for (const id of expiredIds) {
      await execute(
        `UPDATE listings SET status = 'EXPIRED', updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
      expiredCount++;
    }

    return json({ expired_count: expiredCount, expired_ids: expiredIds }, 200, req);
  } catch (err) {
    console.error('Error checking listing expiry:', err);
    return error('Internal server error', 500, req);
  }
}
