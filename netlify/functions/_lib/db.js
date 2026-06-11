const TURSO_URL = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://');
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function tursoFetch(statements) {
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statements: statements.map(s => ({
        q: s.sql,
        params: s.args || [],
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  // data is an array of results, one per statement
  if (data[0]?.error) {
    throw new Error(`Turso: ${data[0].error.message || JSON.stringify(data[0].error)}`);
  }
  return data;
}

function toRows(result) {
  if (!result?.results) return [];
  const { columns, rows } = result.results;
  return rows.map(r => {
    const obj = {};
    columns.forEach((c, i) => { obj[c] = r[i]; });
    return obj;
  });
}

export async function query(sql, args = []) {
  const data = await tursoFetch([{ sql, args }]);
  return { rows: toRows(data[0]) };
}

export async function queryOne(sql, args = []) {
  const result = await query(sql, args);
  return result.rows[0] ?? null;
}

export async function execute(sql, args = []) {
  return tursoFetch([{ sql, args }]);
}

// Legacy compat: getDb() returns { execute({ sql, args }) → { rows } }
export function getDb() {
  return { execute: ({ sql, args }) => query(sql, args) };
}
