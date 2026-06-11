# EcoTrace Project — Jules Agent Instructions

## Project Overview
Campus second-hand item reuse + carbon reduction platform (Vue 3 SPA + Netlify Functions + Turso + ZhipuAI).

## Tech Stack
- **Frontend**: Vue 3 (ESM, no build), Vue Router, Tailwind CSS Play CDN
- **Backend**: Netlify Functions (serverless, `.mjs` files)
- **Database**: Turso (cloud SQLite, `@tursodatabase/serverless`)
- **AI**: ZhipuAI GLM-4V-Flash (multimodal image recognition, 1 image per request)
- **Deployment**: Netlify

## Key Rules
- Use `config.path` for function routing (not netlify.toml redirects)
- Use `.mjs` extension for Netlify Functions
- Use `@tursodatabase/serverless` (NOT `@libsql/client`)
- Use `glm-4v-flash` (free, stable, supports base64). `glm-4.6v-flash` exists but is heavily rate-limited
- `glm-4v-flash` only supports 1 image per request — multi-image is handled by parallel requests + result merging in `ai-client.js`
- No CDN references — all vendors are self-hosted in `public/assets/vendor/`
- No Tailwind `@apply` in external CSS (Play CDN doesn't support it)
- Carbon data labels must include "预计" or "估算"
- No shopping cart / order / payment terminology

## Using Context7
Before implementing any library feature, use Context7 to fetch latest docs:
```
Use context7 to resolve library docs for: [library name]
```
This ensures you use current API patterns, not outdated ones.

## Directory Structure
```
new-site/public/          — Vue 3 SPA (static site)
  assets/                 — JS modules, CSS, images, vendor libs
  index.html              — SPA entry point
netlify/functions/        — Serverless API functions
  _lib/                   — Shared modules (db, response, auth, carbon-engine, ai-client)
tasks/                    — Jules dispatch task definitions
.planning/                — Project planning docs
```
