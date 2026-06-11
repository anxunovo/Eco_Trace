import { query, queryOne } from './_lib/db.js';
import { ok, badRequest, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/listings' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return methodNotAllowed(req);

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const campus = url.searchParams.get('campus');
    const tradeMode = url.searchParams.get('tradeMode');
    const search = url.searchParams.get('q');
    const status = url.searchParams.get('status');
    const ownerId = url.searchParams.get('ownerId');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const args = [];

    if (ownerId) {
      const user = await getAuthUser(req, queryOne);
      if (!user) return error('Unauthorized', 401, req);
      if (user.id !== ownerId && user.role !== 'ADMIN') return error('Forbidden', 403, req);
      conditions.push('l.owner_id = ?');
      args.push(ownerId);
    }

    if (status && status !== 'ALL') {
      conditions.push('l.status = ?');
      args.push(status);
    } else if (!ownerId) {
      conditions.push("l.status = 'ACTIVE'");
    }

    if (category) {
      conditions.push('l.category = ?');
      args.push(category);
    }
    if (campus) {
      conditions.push('l.campus = ?');
      args.push(campus);
    }
    if (tradeMode) {
      conditions.push('l.trade_mode = ?');
      args.push(tradeMode);
    }
    if (search) {
      conditions.push('(l.title LIKE ? OR l.description LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? conditions.join(' AND ') : '1 = 1';

    const countResult = await query(
      `SELECT COUNT(*) as cnt FROM listings l WHERE ${where}`,
      args
    );
    const total = countResult.rows[0].cnt;

    const rows = await query(
      `SELECT l.*, u.nickname, u.avatar
       FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const listings = rows.rows.map(row => ({
      id: row.id,
      ownerId: row.owner_id,
      title: row.title,
      description: row.description,
      category: row.category,
      tradeMode: row.trade_mode,
      price: row.price,
      swapWanted: row.swap_wanted,
      condition: row.condition,
      campus: row.campus,
      locationText: row.location_text,
      contactMethod: row.contact_method,
      contactValue: row.contact_value,
      images: JSON.parse(row.images || '[]'),
      estimatedWeightKg: row.estimated_weight_kg,
      estimatedCarbonSavedKg: row.estimated_carbon_saved_kg,
      aiConfidence: row.ai_confidence,
      aiAssumptions: JSON.parse(row.ai_assumptions || '[]'),
      isFood: row.is_food === 1,
      foodInfo: row.food_info ? JSON.parse(row.food_info) : null,
      tags: JSON.parse(row.tags || '[]'),
      interestedCount: row.interested_count,
      status: row.status,
      createdAt: row.created_at,
      owner: { nickname: row.nickname, avatar: row.avatar },
    }));

    return ok({ success: true, listings, data: listings, total, page, limit }, req);
  } catch (err) {
    console.error('Listings GET error:', err);
    return badRequest('Failed to fetch listings', req);
  }
}
