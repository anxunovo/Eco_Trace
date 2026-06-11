import { query, execute } from './_lib/db.js';
import { json, error } from './_lib/response.js';

export default async function handler(req) {
  try {
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

    console.log(`Expired ${expiredCount} food items.`);

    return json({ expired_count: expiredCount, expired_ids: expiredIds }, 200, req);
  } catch (err) {
    console.error('Error in scheduled-expire-food:', err);
    return error('Internal server error', 500, req);
  }
}
