import { query, execute, queryOne } from './_lib/db.js';
import { json, error, cors } from './_lib/response.js';
import { getAuthUser } from './_lib/auth.js';

export const config = { path: ['/api/coefficients', '/api/coefficients/history'] };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);

  const url = new URL(req.url);

  if (req.method === 'GET') {
    try {
      if (url.pathname.endsWith('/history')) {
        const category = url.searchParams.get('category');
        if (!category) return error('Missing required query parameter: category', 400, req);

        const { rows } = await query(
          `SELECT * FROM carbon_coefficients WHERE category = ? ORDER BY effective_from DESC`,
          [category]
        );
        return json(rows, 200, req);
      }

      const category = url.searchParams.get('category');
      const sql = category
        ? `SELECT * FROM carbon_coefficients WHERE category = ? AND effective_to IS NULL ORDER BY effective_from DESC`
        : `SELECT * FROM carbon_coefficients WHERE effective_to IS NULL ORDER BY category, effective_from DESC`;
      const { rows } = await query(sql, category ? [category] : []);
      return json(rows, 200, req);
    } catch (err) {
      console.error('Coefficients GET error:', err);
      return error(err.message, 500, req);
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await getAuthUser(req, queryOne);
      if (!user) return error('Unauthorized', 401, req);
      if (user.role !== 'ADMIN') return error('Forbidden: Admin access required', 403, req);

      const body = await req.json();
      const { category, subcategory, mode, factor, substitution_rate, default_weight_kg, source, source_ref, note } = body;

      if (!category || !mode || factor === undefined) {
        return error('Missing required fields: category, mode, factor', 400, req);
      }

      const sub = subcategory || null;
      const src = source || 'custom';

      await execute(
        `UPDATE carbon_coefficients SET effective_to = datetime('now')
         WHERE category = ? AND (subcategory IS NULL AND ? IS NULL OR subcategory = ?)
         AND source = ? AND effective_to IS NULL`,
        [category, sub, sub, src]
      );

      await execute(
        `INSERT INTO carbon_coefficients (category, subcategory, mode, factor, substitution_rate, default_weight_kg, source, source_ref, note, effective_from)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [category, sub, mode, factor,
         substitution_rate !== undefined ? substitution_rate : 1.0,
         default_weight_kg !== undefined ? default_weight_kg : null,
         src, source_ref || null, note || null]
      );

      const { rows } = await query(
        `SELECT * FROM carbon_coefficients WHERE category = ? AND subcategory IS ? AND source = ? AND effective_to IS NULL`,
        [category, sub, src]
      );
      return json(rows[0], 201, req);
    } catch (err) {
      console.error('Coefficients POST error:', err);
      return error(err.message, 500, req);
    }
  }

  return error('Method Not Allowed', 405, req);
}
