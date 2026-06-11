import { createClient } from '@libsql/client';
import fs from 'fs';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
}

const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
});

async function exportToSql() {
    let sqlDump = '';

    // Get all schemas (tables, indexes, triggers, views)
    const allSchemaResult = await client.execute("SELECT sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL");
    for (const row of allSchemaResult.rows) {
        sqlDump += `${row.sql};\n\n`;
    }

    // Get all tables
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesResult.rows.map(r => r.name);

    // For each table, get data
    for (const table of tables) {

        // Data
        const dataResult = await client.execute(`SELECT * FROM ${table}`);
        for (const row of dataResult.rows) {
            const columns = Object.keys(row).filter(k => isNaN(k));
            const values = columns.map(c => {
                const val = row[c];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
            });
            sqlDump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-${date}.sql`;
    fs.writeFileSync(filename, sqlDump);
    console.log(`Backup saved to ${filename}`);
}

exportToSql().catch(console.error);
