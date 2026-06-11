import { queryOne } from './_lib/db.js';
import { ok, notFound, methodNotAllowed, cors, badRequest } from './_lib/response.js';

export const config = { path: '/api/listing' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'GET') return methodNotAllowed(req);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return badRequest('Missing id parameter', req);

    const row = await queryOne(
      `SELECT l.*, u.nickname, u.avatar
       FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (!row) return notFound('Listing not found', req);

    const listing = {
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
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      owner: { nickname: row.nickname, avatar: row.avatar },
    };

    return ok({ listing }, req);
  } catch (err) {
    console.error('Listing detail error:', err);
    return badRequest('Failed to fetch listing', req);
  }
}
