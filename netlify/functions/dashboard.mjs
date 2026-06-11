import { query } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';

export const config = { path: '/api/dashboard' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return error('Method not allowed', 405, req);

  try {
    const url = new URL(req.url);
    const userIdQuery = url.searchParams.get('userId');
    const targetUserId = userIdQuery || null;

    const { rows: statsRows } = await query(`
      SELECT
        COALESCE(SUM(carbon_saved_kg), 0) as totalCarbonSaved,
        COUNT(*) as totalCompletedListings,
        COALESCE(SUM(CASE WHEN is_food = 1 THEN carbon_saved_kg ELSE 0 END), 0) as totalFoodSaved
      FROM carbon_records
    `);
    const stats = statsRows[0] || { totalCarbonSaved: 0, totalCompletedListings: 0, totalFoodSaved: 0 };

    const { rows: categoryRows } = await query(`
      SELECT category, SUM(carbon_saved_kg) as carbon, COUNT(*) as count
      FROM carbon_records GROUP BY category
    `);
    const byCategory = {};
    for (const row of categoryRows) {
      byCategory[row.category] = { carbon: row.carbon, count: row.count };
    }

    const { rows: leaderboardRows } = await query(`
      SELECT c.user_id, u.nickname, SUM(c.carbon_saved_kg) as carbon
      FROM carbon_records c
      LEFT JOIN users u ON c.user_id = u.id
      GROUP BY c.user_id
      ORDER BY carbon DESC LIMIT 10
    `);
    const leaderboard = leaderboardRows.map((row, i) => ({
      userId: row.user_id,
      nickname: row.nickname,
      carbon: row.carbon,
      rank: i + 1,
    }));

    const { rows: recentRows } = await query(`
      SELECT c.id, c.user_id, c.listing_id, c.category, c.carbon_saved_kg,
             c.is_food, c.weight_kg, c.source, c.created_at, l.title
      FROM carbon_records c
      LEFT JOIN listings l ON c.listing_id = l.id
      ORDER BY c.created_at DESC LIMIT 10
    `);

    let userStats = null;
    if (targetUserId) {
      const { rows: userRows } = await query(
        `SELECT COALESCE(SUM(carbon_saved_kg), 0) as myCarbon, COUNT(*) as myCompleted
         FROM carbon_records WHERE user_id = ?`,
        [targetUserId]
      );
      const u = userRows[0] || { myCarbon: 0, myCompleted: 0 };

      const { rows: rankRows } = await query(`
        SELECT user_id, SUM(carbon_saved_kg) as carbon
        FROM carbon_records GROUP BY user_id ORDER BY carbon DESC
      `);
      const rankIdx = rankRows.findIndex(r => r.user_id === targetUserId);

      userStats = {
        myCarbon: u.myCarbon,
        myCompletedListings: u.myCompleted,
        myRank: rankIdx !== -1 ? rankIdx + 1 : null,
      };
    }

    return json({
      success: true,
      data: {
        totalCarbonSaved: stats.totalCarbonSaved,
        totalCompletedListings: stats.totalCompletedListings,
        totalFoodSaved: stats.totalFoodSaved,
        byCategory,
        recentRecords: recentRows,
        userStats,
        leaderboard,
      },
    }, 200, req);
  } catch (err) {
    console.error('Dashboard error:', err);
    return error('Internal server error', 500, req);
  }
}
