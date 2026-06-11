# Performance Audit Report

Target: https://stu-eco-trace.netlify.app

## 1. Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| / | 47 | 84 | 100 | 92 |
| /listings | 68 | 86 | 100 | 92 |
| /publish | 95 | 84 | 100 | 91 |
| /impact | 93 | 82 | 96 | 91 |
| /me | 96 | 82 | 100 | 91 |
| /admin | 93 | 80 | 100 | 91 |

## 2. Core Web Vitals

Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

| Page | LCP | INP | CLS |
|---|---|---|---|
| / | 4.87s ❌ | 4.93s ❌ | 0.000 ✅ |
| /listings | 7.57s ❌ | 7.57s ❌ | 0.000 ✅ |
| /publish | 2.36s ✅ | 2.45s ❌ | 0.000 ✅ |
| /impact | 2.58s ❌ | 2.83s ❌ | 0.000 ✅ |
| /me | 2.27s ✅ | 2.35s ❌ | 0.000 ✅ |
| /admin | 2.54s ❌ | 2.68s ❌ | 0.000 ✅ |

## 3. Network & Javascript Bundle Analysis

| Page | Total JS Weight | Unused JS | API Latency (ms) |
|---|---|---|---|
| / | 171.52 KB | Est savings of 39 KiB | 64.7 |
| /listings | 171.50 KB | Est savings of 37 KiB | 29.4 |
| /publish | 214.18 KB | Est savings of 39 KiB | 14.4 |
| /impact | 214.17 KB | Est savings of 36 KiB | 16.4 |
| /me | 214.31 KB | Est savings of 61 KiB | 13.3 |
| /admin | 214.33 KB | Est savings of 38 KiB | 11.3 |

## 4. Recommendations & Findings

### Critical Issues
- **Poor Performance on Home & Listings Pages**: The performance scores for Home (47) and Listings (68) are well below the target of 90.
- **LCP & INP Failures**: The Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) targets (< 2.5s and < 200ms respectively) are missed significantly on Home and Listings pages. This is likely due to the initial fetching of listings blocking the main content rendering.

### Recommendations
1. **Optimize Javascript Bundles**: Reduce unused Javascript. The Vue browser build (`vue.esm-browser.prod.js`) and Tailwind (`tailwind.js`) represent significant payloads. Consider moving to a build step (Vite) rather than using browser builds and CDN scripts in production to tree-shake unused code and pre-compile templates.
2. **Skeleton Loading / Eager LCP**: The home and listings pages wait for API calls to complete before rendering content, pushing back the LCP. Implement skeleton loaders or eager-load critical above-the-fold content.
3. **Image Optimization**: Ensure uploaded images are resized and compressed on the backend before being served to the frontend. Leverage WebP format if possible.
4. **Accessibility (A11y)**: Several pages hover around ~82-86 accessibility score. Common issues like foreground/background contrast need to be fixed to hit 100%.
