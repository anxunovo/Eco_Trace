import { queryOne, query } from './_lib/db.js';
import { ok, notFound, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';
import { getUserBadges, getBadgeDefinitions } from './_lib/badges.js';

export const config = { path: '/api/user/profile' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return methodNotAllowed(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);
    const profile = await queryOne(
      'SELECT id, nickname, avatar, school, campus, role, eco_points FROM users WHERE id = ?',
      [user.id]
    );
    if (!profile) return notFound('User not found', req);

    const listingCount = await query(
      "SELECT COUNT(*) as cnt FROM listings WHERE owner_id = ? AND status != 'REMOVED'",
      [user.id]
    );
    const activeCount = await query(
      "SELECT COUNT(*) as cnt FROM listings WHERE owner_id = ? AND status = 'ACTIVE'",
      [user.id]
    );
    const carbonTotal = await query(
      "SELECT COALESCE(SUM(estimated_carbon_saved_kg), 0) as total_carbon FROM listings WHERE owner_id = ? AND status IN ('ACTIVE', 'COMPLETED')",
      [user.id]
    );

    const badges = await getUserBadges(profile.id);
    const allBadges = getBadgeDefinitions();

    const payload = {
      id: profile.id,
      nickname: profile.nickname,
      avatar: profile.avatar,
      school: profile.school,
      campus: profile.campus,
      role: profile.role,
      ecoPoints: profile.eco_points,
      listingCount: listingCount.rows[0].cnt,
      activeCount: activeCount.rows[0].cnt,
      totalCarbonSavedKg: carbonTotal.rows[0].total_carbon,
      badges,
      allBadges,
    };
    return ok({ success: true, data: payload, ...payload }, req);
  } catch (err) {
    console.error('User profile error:', err);
    return error('Internal Server Error', 500, req);
  }
}
