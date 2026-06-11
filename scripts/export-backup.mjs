import fs from 'fs';
import { query } from '../netlify/functions/_lib/db.js';

async function exportTables() {
    // We will do a generic SQL export using queries.
    // Ensure TURSO_DATABASE_URL is set in environment when executing.

    const tables = ['users', 'listings', 'interests', 'carbon_records', 'carbon_coefficients'];
    let sqlOutput = '';

    for (const table of tables) {
        try {
            const data = await query(`SELECT * FROM ${table}`);
            if (data && data.rows && data.rows.length > 0) {
                // Determine column names
                const columns = Object.keys(data.rows[0]);
                const colsStr = columns.join(', ');

                for (const row of data.rows) {
                    const vals = columns.map(col => {
                        let val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        // Escape single quotes for SQL string literal
                        return `'${String(val).replace(/'/g, "''")}'`;
                    });

                    sqlOutput += `INSERT INTO ${table} (${colsStr}) VALUES (${vals.join(', ')});\n`;
                }
            }
        } catch (e) {
            console.error(`Failed to export table ${table}:`, e);
        }
    }

    fs.writeFileSync('backup.sql', sqlOutput);
    console.log('Database export complete. Saved to backup.sql');
}

exportTables();
