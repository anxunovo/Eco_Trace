import { query, execute, queryOne } from './db.js';

const BADGE_DEFS = [
  { key: 'FIRST_PUBLISH', icon: '🌱', name: '首次发布', desc: '发布第一个物品', condition: c => c.listingCount >= 1 },
  { key: 'FIRST_COMPLETE', icon: '🤝', name: '首次流转', desc: '完成第一次物品流转', condition: c => c.completedCount >= 1 },
  { key: 'CARBON_10', icon: '🌿', name: '减碳达人', desc: '累计减碳达到 10 kg', condition: c => c.totalCarbonKg >= 10 },
  { key: 'CARBON_50', icon: '🌳', name: '环保先锋', desc: '累计减碳达到 50 kg', condition: c => c.totalCarbonKg >= 50 },
  { key: 'CARBON_100', icon: '🏆', name: '碳中和之星', desc: '累计减碳达到 100 kg', condition: c => c.totalCarbonKg >= 100 },
  { key: 'TRADE_10', icon: '📦', name: '二手达人', desc: '完成 10 次物品流转', condition: c => c.completedCount >= 10 },
];

export function getBadgeDefinitions() {
  return BADGE_DEFS.map(b => ({ key: b.key, icon: b.icon, name: b.name, desc: b.desc }));
}

export async function getUserBadges(userId) {
  const rows = await query(
    'SELECT badge_key, earned_at FROM user_badges WHERE user_id = ?',
    [userId]
  );
  return rows.rows.map(r => ({ key: r.badge_key, earnedAt: r.earned_at }));
}

export async function checkAndAwardBadges(userId) {
  const [listings, completed, carbon] = await Promise.all([
    queryOne("SELECT COUNT(*) as cnt FROM listings WHERE owner_id = ?", [userId]),
    queryOne("SELECT COUNT(*) as cnt FROM listings WHERE owner_id = ? AND status = 'COMPLETED'", [userId]),
    queryOne("SELECT COALESCE(SUM(estimated_carbon_saved_kg), 0) as total FROM listings WHERE owner_id = ? AND status = 'COMPLETED'", [userId]),
  ]);

  const ctx = {
    listingCount: listings?.cnt ?? 0,
    completedCount: completed?.cnt ?? 0,
    totalCarbonKg: carbon?.total ?? 0,
  };

  const earned = await getUserBadges(userId);
  const earnedKeys = new Set(earned.map(b => b.key));

  const newlyAwarded = [];
  for (const def of BADGE_DEFS) {
    if (earnedKeys.has(def.key)) continue;
    if (!def.condition(ctx)) continue;

    const id = `bg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await execute(
      'INSERT OR IGNORE INTO user_badges (id, user_id, badge_key) VALUES (?, ?, ?)',
      [id, userId, def.key]
    );
    newlyAwarded.push({ key: def.key, icon: def.icon, name: def.name, desc: def.desc });
  }

  return newlyAwarded;
}
