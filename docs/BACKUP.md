# Database Backup and Restoration Procedures

This document outlines the backup and restoration procedures for the Turso database.

## Automatic Backups (Turso)

Turso automatically handles backups based on the plan. For production databases, it's recommended to ensure automated backups are enabled.

### Verifying Turso Backups
1. Log in to the Turso Dashboard (https://turso.tech).
2. Navigate to your database.
3. Go to the **Backups** tab to view the backup history and frequency.
4. Retention policy: 30 days (default for production plans, verify on dashboard).

### Restoring from Turso Dashboard
1. Go to the **Backups** tab of your database.
2. Select a backup point and click **Restore**.
3. You can restore over the existing database or to a new database.

## Manual Backups (Export/Import Script)

For additional security, you can perform manual backups by exporting the database to a `.sql` file using the provided script.

### Exporting Database to SQL

A script is provided to export the schema and data to a SQL file.

**Requirements:**
- Node.js installed
- `@libsql/client` installed (`npm install @libsql/client`)
- Environment variables configured:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`

**Running the export script:**
```bash
node scripts/turso-backup.mjs
```
This will generate a file named `backup-YYYY-MM-DD.sql` in your current directory.

### Importing SQL Backup

To restore from a manual SQL backup, you can use the Turso CLI:

```bash
turso db shell <database-name> < backup-YYYY-MM-DD.sql
```

## Database Reset and Data Migration

If you need to reset the database to its initial state or re-run seed data, follow these steps.

### Reset Database
To completely wipe the database, you can drop all tables manually or recreate the database using the Turso CLI:

```bash
# Delete existing database
turso db destroy <database-name>

# Create new database
turso db create <database-name>
```

### Apply Schema
Run the schema script to create all necessary tables:
```bash
node scripts/apply-schema.mjs
```

### Re-run Seed Data
If you need to populate the database with initial seed data:
```bash
node scripts/seed-turso.mjs
```

## Support and Contact
For issues related to Turso infrastructure or backups, contact Turso Support:
- Support Portal: https://turso.tech/support
- Documentation: https://docs.turso.tech

## Testing Database Reset and Migration
You can simulate a reset and seed process locally to verify the behavior:
```bash
export TURSO_DATABASE_URL="file:test.db"
export TURSO_AUTH_TOKEN="test"
node scripts/apply-schema.mjs
node scripts/seed-turso.mjs
```
This will create a `test.db` file and populate it with seed data, demonstrating that the reset scripts are functional.
