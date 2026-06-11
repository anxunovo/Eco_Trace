import { ok, cors } from './_lib/response.js';
export const config = { path: '/api/health' };
export default async (req) => req.method === 'OPTIONS' ? cors(req) : ok({ status: 'ok', timestamp: new Date().toISOString() }, req);
