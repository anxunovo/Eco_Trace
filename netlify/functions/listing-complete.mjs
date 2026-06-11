import { execute, query, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';
import { checkAndAwardBadges } from './_lib/badges.js';
import crypto from 'crypto';

export const config = { path: '/api/listings/:id/complete' };

export default async function handler(req, context) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return error('Method not allowed', 405, req);

  const user = await getAuthUser(req, queryOne);
  if (!user) return error('Unauthorized', 401, req);
  const userId = user.id;
  if (!userId) return error('Unauthorized', 401, req);

  const listingId = context?.params?.id || (() => {
    const parts = new URL(req.url).pathname.split('/');
    return parts[parts.indexOf('listings') + 1];
  })();

  if (!listingId) return error('Listing ID is required', 400, req);

  try {
    const listing = await queryOne(
      'SELECT * FROM listings WHERE id = ?',
      [listingId]
    );

    if (!listing) return error('Listing not found', 404, req);
    if (listing.owner_id !== userId) return error('Forbidden: not your listing', 403, req);
    if (listing.status === 'COMPLETED') return error('Already completed', 400, req);
    if (listing.status !== 'ACTIVE') return error('Only active listings can be completed', 400, req);

    const carbonSavedKg = listing.estimated_carbon_saved_kg || 0;
    const pointsEarned = Math.round(carbonSavedKg * 10);
    const crId = 'cr_' + crypto.randomBytes(8).toString('hex');

    await execute(
      `UPDATE listings SET status = 'COMPLETED', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [listingId]
    );

    await execute(
      `INSERT INTO carbon_records (id, user_id, listing_id, category, is_food, weight_kg, carbon_saved_kg, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'LISTING_COMPLETED', datetime('now'))`,
      [crId, userId, listingId, listing.category, listing.is_food,
       listing.estimated_weight_kg || 0, carbonSavedKg]
    );

    await execute(
      `UPDATE users SET eco_points = eco_points + ?, updated_at = datetime('now') WHERE id = ?`,
      [pointsEarned, userId]
    );

    const updated = await queryOne('SELECT * FROM listings WHERE id = ?', [listingId]);
    const record = await queryOne('SELECT * FROM carbon_records WHERE id = ?', [crId]);

    const newBadges = await checkAndAwardBadges(userId);

    return json({
      message: 'Listing completed successfully',
      listing: updated,
      carbon_record: record,
      points_earned: pointsEarned,
      new_badges: newBadges,
    }, 200, req);
  } catch (err) {
    console.error('Error completing listing:', err);
    return error('Internal server error', 500, req);
  }
}
