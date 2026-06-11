import fs from 'fs';
import { execute } from '../netlify/functions/_lib/db.js';

async function importBackup() {
    const backupSql = fs.readFileSync('backup.sql', 'utf8');
    const statements = backupSql.split(';\n').filter(s => s.trim().length > 0);

    console.log(`Found ${statements.length} statements to import.`);

    for (const sql of statements) {
        // we use OR IGNORE to prevent unique constraint issues when testing import
        // on a db that might already contain the same data
        const safeSql = sql.replace('INSERT INTO', 'INSERT OR IGNORE INTO');
        try {
            await execute(safeSql);
        } catch (e) {
            console.error(`Failed to execute statement: ${safeSql}`);
            console.error(e);
        }
    }
    console.log('Import complete.');
}

importBackup();
