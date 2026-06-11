import { execute, queryOne } from './_lib/db.js';
import { created, badRequest, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';
import { estimateCarbon } from './_lib/carbon-engine.js';
import { checkAndAwardBadges } from './_lib/badges.js';

export const config = { path: '/api/listings/create' };

function generateId() {
  return 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return methodNotAllowed(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);
    const body = await req.json();

    const { title, description, category, tradeMode, price, swapWanted,
      condition, campus, locationText, contactMethod, contactValue,
      images, isFood, foodInfo, tags } = body;

    if (!title || !category) {
      return badRequest('Missing required fields: title, category', req);
    }
    if (title.length > 100) return badRequest('标题不超过 100 字', req);
    if ((description || '').length > 2000) return badRequest('描述不超过 2000 字', req);
    if ((locationText || '').length > 200) return badRequest('地点不超过 200 字', req);
    if ((contactValue || '').length > 100) return badRequest('联系方式不超过 100 字', req);

    const id = generateId();
    const carbonResult = await estimateCarbon({
      category,
      weightKg: body.estimatedWeightKg,
      foodInfo,
      condition,
    });

    const now = new Date().toISOString();
    const safeFoodInfo = foodInfo ? JSON.stringify(foodInfo) : null;

    await execute(
      `INSERT INTO listings (
        id, owner_id, title, description, category, trade_mode, price, swap_wanted,
        condition, campus, location_text, contact_method, contact_value,
        images, estimated_weight_kg, estimated_carbon_saved_kg,
        ai_confidence, ai_assumptions, is_food, food_info, tags,
        interested_count, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE', ?, ?)`,
      [
        id, user.id, title, description || '', category,
        tradeMode || 'FREE', price || null, swapWanted || null,
        condition || 'GOOD', campus || '', locationText || '',
        contactMethod || 'wechat', contactValue || '',
        JSON.stringify(images || []),
        carbonResult.weightKg, carbonResult.carbonSavedKg,
        carbonResult.confidence, JSON.stringify(carbonResult.assumptions),
        isFood ? 1 : 0, safeFoodInfo,
        JSON.stringify(tags || []),
        now, now
      ]
    );

    const newBadges = await checkAndAwardBadges(user.id);

    return created({
      id,
      estimatedCarbonSavedKg: carbonResult.carbonSavedKg,
      carbonSource: carbonResult.source,
      carbonAssumptions: carbonResult.assumptions,
      new_badges: newBadges,
    }, req);
  } catch (err) {
    console.error('Listing create error:', err);
    return badRequest('Failed to create listing', req);
  }
}
