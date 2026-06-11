import { query, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/admin/listings' };

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function toListing(row) {
  return {
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
    images: parseJson(row.images, []),
    estimatedWeightKg: row.estimated_weight_kg,
    estimatedCarbonSavedKg: row.estimated_carbon_saved_kg,
    aiConfidence: row.ai_confidence,
    aiAssumptions: parseJson(row.ai_assumptions, []),
    isFood: row.is_food === 1,
    foodInfo: parseJson(row.food_info, null),
    tags: parseJson(row.tags, []),
    interestedCount: row.interested_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    owner: { nickname: row.nickname, avatar: row.avatar },
  };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return error('Method not allowed', 405, req);

  const user = await getAuthUser(req, queryOne);
  if (!user) return error('Unauthorized', 401, req);
  if (user.role !== 'ADMIN') return error('Forbidden: Admin access required', 403, req);

  try {
    const { rows } = await query(
      `SELECT l.*, u.nickname, u.avatar
       FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       ORDER BY l.created_at DESC`
    );
    const listings = rows.map(toListing);
    return json({ success: true, data: listings, listings }, 200, req);
  } catch (err) {
    console.error('Admin listings error:', err);
    return error('Internal server error', 500, req);
  }
}
