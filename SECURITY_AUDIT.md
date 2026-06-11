# Security Audit Report

**Date:** 2025-02-14
**Target:** Production Site (https://stu-eco-trace.netlify.app)
**Status:** In Progress (Phase 4)

## Executive Summary
A comprehensive security audit was conducted targeting the production environment of Stu Eco Trace. The audit covered dependencies, API security, authentication flows, and configuration integrity. Critical issues regarding authentication bypass and permissive CORS configurations were identified and remediated.

## Dependency Vulnerability Scan
- **Action:** `npm audit` was executed on the root project.
- **Result:** Found 0 vulnerabilities. Dependencies are up to date and secure.

## Findings & Remediation

### 1. Insecure Fallback Identity (Critical Risk)
**Issue:** The backend utility `getUser` located in `netlify/functions/_lib/auth.js` would return a hardcoded demo user object (`u_alice`) if the `Authorization` header or legacy `x-user-id` header was omitted. This meant any unauthenticated request to several endpoints (`/api/user/profile`, `/api/carbon/stats`, `/api/coefficients`, `/api/user`) was incorrectly treated as authenticated.
**Fix:** Removed the `DEMO_USER` fallback. The `getUser` function now returns `null`. Added strict `if (!user)` checks returning `401 Unauthorized` across the following endpoints:
- `user-profile.mjs`
- `carbon-stats.mjs` (for `scope=user` only)
- `coefficients.mjs`
- `user.mjs`
- `auth-me.mjs` (already correctly validated session, but inherits the `getUser` fix).

### 2. Overly Permissive CORS (Medium Risk)
**Issue:** The global `cors()` and `json()` helper responses in `_lib/response.js` had `Access-Control-Allow-Origin: *`. This allowed any external domain to make requests to the API endpoints and read the responses.
**Fix:** Replaced the wildcard `*` with the explicit production domain: `https://stu-eco-trace.netlify.app`.

### 3. Missing Explicit Input Character Limits (Low Risk)
**Issue:** Endpoints like `listing-create.mjs` and `listing-update.mjs` check for the presence of inputs (e.g., `title`, `category`) but do not explicitly validate maximum character lengths before attempting database insertion. While SQLite will gracefully store standard lengths, extremely large payloads could be sent to consume memory or storage.
**Status:** Acknowledged. Netlify's request limits provide some network-level protection, but explicit character limits (e.g. `title.length > 100`) should be added in a future update.

## Authentication Security Review
- **Password Hashing:** Implemented correctly using `crypto.pbkdf2Sync` with a 16-byte salt, 100,000 iterations, and `sha512`. Secure.
- **Session Tokens:** Securely generated using `crypto.randomBytes(32).toString('hex')`.
- **Token Expiration:** Sessions expire in 7 days, checked securely during validation.
- **Password Reset:** Currently not implemented. Note for future feature requests.

## Environment & Transport Security
- **Environment Variables:** `.env` and `.env.local` are safely excluded via `.gitignore`. No sensitive variables or keys were found committed to git.
- **HTTPS & TLS:** Netlify enforces HTTPS connections on `*.netlify.app` and successfully manages certificates natively. No mixed content was detected.

## Prioritized List of Next Steps (v1.1)
1. Implement explicit character length validation on all text inputs in `listing-create.mjs` and `listing-update.mjs` to prevent excessively large DB payloads.
2. Add rate-limiting logic on the `POST /api/auth/register` and `POST /api/auth/login` routes to mitigate brute-forcing (this may require a basic in-memory store or an external Redis service).
3. Validate base64 image strings strictly to ensure they are valid image formats (png, jpeg, webp) before storage.