import { queryOne, execute } from './_lib/db.js';
import { ok, badRequest, notFound, methodNotAllowed, cors, error } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: '/api/listings/update' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'PUT') return methodNotAllowed(req);

  try {
    const user = await getAuthUser(req, queryOne);
    if (!user) return error('Unauthorized', 401, req);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return badRequest('Missing id', req);

    const existing = await queryOne(
      'SELECT owner_id, status FROM listings WHERE id = ?', [id]
    );
    if (!existing) return notFound('Not found', req);
    if (existing.owner_id !== user.id) return badRequest('Not owner', req);

    const body = await req.json();
    if (body.title && body.title.length > 100) return badRequest('标题不超过 100 字', req);
    if (body.description && body.description.length > 2000) return badRequest('描述不超过 2000 字', req);
    if (body.locationText && body.locationText.length > 200) return badRequest('地点不超过 200 字', req);
    if (body.contactValue && body.contactValue.length > 100) return badRequest('联系方式不超过 100 字', req);

    const fields = {};
    const allowed = ['title', 'description', 'category', 'tradeMode', 'price',
      'swapWanted', 'condition', 'campus', 'locationText',
      'contactMethod', 'contactValue', 'images', 'tags', 'status',
      'estimatedWeightKg', 'estimatedCarbonSavedKg', 'aiConfidence',
      'aiAssumptions', 'isFood', 'foodInfo'];

    const dbMap = {
      tradeMode: 'trade_mode', swapWanted: 'swap_wanted',
      locationText: 'location_text', contactMethod: 'contact_method',
      contactValue: 'contact_value', estimatedWeightKg: 'estimated_weight_kg',
      estimatedCarbonSavedKg: 'estimated_carbon_saved_kg',
      aiConfidence: 'ai_confidence', aiAssumptions: 'ai_assumptions',
      isFood: 'is_food', foodInfo: 'food_info',
    };

    for (const key of allowed) {
      if (body[key] !== undefined) {
        const col = dbMap[key] || key;
        let val = body[key];
        if (key === 'images' || key === 'tags' || key === 'aiAssumptions' || key === 'foodInfo') {
          val = val === undefined ? null : JSON.stringify(val);
        }
        if (key === 'isFood') val = val ? 1 : 0;
        fields[col] = val;
      }
    }

    if (Object.keys(fields).length === 0) return badRequest('No fields to update', req);

    fields['updated_at'] = new Date().toISOString();
    const sets = Object.keys(fields).map(k => `\`${k}\` = ?`).join(', ');
    const vals = Object.values(fields);

    await execute(`UPDATE listings SET ${sets} WHERE id = ?`, [...vals, id]);
    return ok({ id, updated: true }, req);
  } catch (err) {
    console.error('Listing update error:', err);
    return badRequest('Failed to update listing', req);
  }
}
