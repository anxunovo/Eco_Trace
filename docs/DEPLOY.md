# Deployment Guide

## Prerequisites
- Node.js installed
- Netlify CLI (`npm i -g netlify-cli`)
- Turso CLI
- Environment variables configured (`.env`)

## Backup Schedule
The production database hosted on Turso is configured with **automatic daily backups**, retaining the backups for **30 days**. See `BACKUP.md` for full instructions on restoration and manual backups.

## Production Deployment
1. Set up the Netlify project.
2. Link the project repository.
3. Ensure the environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) are configured in the Netlify UI.
4. Deploy using standard Netlify processes.
