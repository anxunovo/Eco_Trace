import { error, cors } from './_lib/response.js';

export const config = { path: '/api/admin/reset' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return cors(req);
  if (req.method !== 'POST') return error('Method not allowed', 405, req);

  return error('Admin reset is not enabled on this deployment', 403, req);
}
