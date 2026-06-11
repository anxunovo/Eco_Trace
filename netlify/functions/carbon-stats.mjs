import { query, queryOne } from './_lib/db.js';
import { ok, methodNotAllowed, cors, badRequest, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/carbon/stats' };

function periodClause(period) {
  if (period === 'week') return "datetime('now', '-7 days')";
  if (period === 'month') return "datetime('now', '-30 days')";
  return null;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return methodNotAllowed(req);

  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') || 'user';
    const period = url.searchParams.get('period') || 'all';
    const timeFilter = periodClause(period);

    if (scope === 'global') {
      const where = timeFilter ? `WHERE c.created_at >= ${timeFilter}` : '';

      const total = await query(
        `SELECT COALESCE(SUM(c.carbon_saved_kg), 0) as total_carbon
         FROM carbon_records c ${where}`
      );
      const count = await query(
        `SELECT COUNT(*) as cnt FROM carbon_records c ${where}`
      );
      const byCategory = await query(
        `SELECT c.category, COALESCE(SUM(c.carbon_saved_kg), 0) as total, COUNT(*) as count
         FROM carbon_records c ${where}
         GROUP BY c.category ORDER BY total DESC`
      );

      // Trend: daily carbon aggregation
      let trendWhere = '';
      const trendPeriod = period === 'all' ? 'month' : period;
      const trendFilter = periodClause(trendPeriod);
      if (trendFilter) trendWhere = `WHERE c.created_at >= ${trendFilter}`;

      const trend = await query(
        `SELECT DATE(c.created_at) as date, COALESCE(SUM(c.carbon_saved_kg), 0) as carbon, COUNT(*) as count
         FROM carbon_records c ${trendWhere}
         GROUP BY DATE(c.created_at) ORDER BY date ASC`
      );

      // Campus comparison via listings join
      const campusComp = await query(
        `SELECT COALESCE(l.campus, '未知') as campus,
                COALESCE(SUM(c.carbon_saved_kg), 0) as carbon, COUNT(*) as count
         FROM carbon_records c
         LEFT JOIN listings l ON c.listing_id = l.id
         ${timeFilter ? `WHERE c.created_at >= ${timeFilter}` : ''}
         GROUP BY l.campus ORDER BY carbon DESC`
      );

      return ok({
        totalCarbonSavedKg: total.rows[0].total_carbon,
        listingCount: count.rows[0].cnt,
        byCategory: byCategory.rows.map(r => ({ category: r.category, total: r.total, count: r.count })),
        trend: trend.rows.map(r => ({ date: r.date, carbon: Math.round(r.carbon * 100) / 100, count: r.count })),
        campusComparison: campusComp.rows.map(r => ({ campus: r.campus, carbon: Math.round(r.carbon * 100) / 100, count: r.count })),
      }, req);
    }

    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);

    const userWhere = timeFilter
      ? `WHERE c.user_id = ? AND c.created_at >= ${timeFilter}`
      : 'WHERE c.user_id = ?';
    const args = [user.id];

    const userTotal = await query(
      `SELECT COALESCE(SUM(c.carbon_saved_kg), 0) as total_carbon FROM carbon_records c ${userWhere}`,
      args
    );
    const userByCategory = await query(
      `SELECT c.category, COALESCE(SUM(c.carbon_saved_kg), 0) as total, COUNT(*) as count
       FROM carbon_records c ${userWhere} GROUP BY c.category`,
      args
    );
    const userCount = await query(
      `SELECT COUNT(*) as cnt FROM carbon_records c ${userWhere}`,
      args
    );

    return ok({
      totalCarbonSavedKg: userTotal.rows[0].total_carbon,
      listingCount: userCount.rows[0].cnt,
      byCategory: userByCategory.rows.map(r => ({ category: r.category, total: r.total, count: r.count })),
    }, req);
  } catch (err) {
    console.error('Carbon stats error:', err);
    return badRequest('Failed to fetch carbon stats', req);
  }
}
