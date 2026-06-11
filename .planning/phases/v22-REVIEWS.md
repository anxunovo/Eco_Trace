---
phase: "12-14 (v2.2)"
reviewers: [gemini, codex]
reviewed_at: 2026-05-10T00:00:00Z
plans_reviewed: [ROADMAP Phase 12, Phase 13, Phase 14]
---

# Cross-AI Plan Review — v2.2 Green Impact & Education

## Gemini Review

### Summary
The v2.2 update successfully transitions EcoTrace from a purely transactional secondhand platform into an impact-aware ecosystem. The implementation of the Carbon Footprint Calculator and Contribution Reports provides the necessary "why" to encourage student participation, while the Eco Knowledge module builds the "how." The architectural choice of a "no-build" ES module system is well-suited for the rapid deployment and campus-contest nature of the project, though it introduces specific risks regarding dependency management and client-side data integrity.

### Strengths
- **Methodological Rigor:** `FOOTPRINT_FACTORS` (transport, grid factors, diet) and `CARBON_EQUIVALENTS` (trees, km) demonstrate "Code-as-Truth" by grounding features in authoritative data rather than arbitrary scores.
- **UX Personalization:** `campusDefaults` in the calculator (adjusting for distance differences between East Coast and Sangpushan campuses) shows excellent attention to local student experience.
- **Surgical Sharing Logic:** `createShareCardState` is well-abstracted. Using `scale: 2` and `useCORS: true` in html2canvas ensures high-resolution images that handle external profile pictures correctly.
- **Device Awareness:** Integration of `useDevice()` in eco-tips.js ensures educational content remains readable across mobile and desktop layouts.

### Concerns
- **Client-Side Persistence Risk (MEDIUM):** Heavy reliance on localStorage. If a student switches from mobile to laptop, Carbon History and Saved Calculations will desync unless the API adapter proactively pushes every change.
- **Memory/Performance (LOW):** Initializing html2canvas via CDN may cause delay on first "Share" click if network is slow (typical in crowded campus areas).
- **Input Validation (MEDIUM):** In calculator.js, `dailyDistanceKm` and `weeklyKwh` are reactive refs. If a user enters non-numeric or extreme values, the `result` computed could produce nonsensical data without a visible error state.
- **Admin Security (HIGH):** Client-side route guards can be bypassed by manual URL manipulation or console commands if backend Netlify Functions do not strictly verify `currentUser.role` for every request.

### Suggestions
- Add debounced watcher in store.js that auto-syncs calcHistory to Turso database.
- Add "Sanity Check" to calculator (cap distance at 50km/day, warn for extreme footprint).
- Pre-load html2canvas via dynamic import when user enters Report page, not on "Share" click.
- Implement "Verification Badge" for tips linking to platform actions.

### Risk Assessment: **LOW**
Overall risk is low because the project is a competition entry with a specific target audience. The "No Build" architecture is a pragmatic choice for the timeline. Primary risks are data consistency and minor UX edge cases. Carbon estimation logic is robustly implemented with cited factors, which is the most critical element for the project's success.

---

## Codex Review

### Summary
v2.2 is functionally broad and visually cohesive, and most requirements are represented in the UI. The main risk is data correctness in deployed/API mode: campus vs personal carbon records are conflated, calculator offsets may use the wrong scope, and eco-tip admin changes are not durable beyond localStorage. Reliability is also weakened by CDN dependencies and the broken service worker.

### Strengths
- Feature set maps clearly to Phases 12-14: report, equivalents, PNG sharing, calculator, history, eco tips, admin editing, and homepage daily tip are all present.
- Share card generation is isolated and testable via injected `html2canvasImpl` and `createLink`.
- Calculator formulas are simple, readable, and source/disclaimer text is visible to users.
- Route guard protects `/admin` for authenticated admin users in API mode.

### Concerns
- **Campus Report Data Scope (HIGH):** carbon-report.js computes campus stats from `state.carbonRecords`, but store.js fetches `/api/carbon/records` which filters by authenticated user. The "校园报告" may show only current user's records, not global campus data. Also leaves stale seed/local records when API returns zero rows because store.js only replaces records when `records.length`.
- **Calculator Offset Overstatement (HIGH):** calculator.js uses `totalCarbonSaved`, but store.js sums all loaded carbon records. In local/demo state this is campus/global, not the current user's savings, so offset meter may claim more offset than the user personally achieved.
- **CDN Dependency Risk (HIGH):** Chart.js/html2canvas loaded from jsDelivr CDN without SRI protection, breaks offline (despite PWA goals), and charts.js assumes global `Chart` without graceful fallback.
- **Eco Tips CRUD Local-Only (MEDIUM):** admin.js calls local `actions.saveEcoTip` which persists only to localStorage. No Turso schema/API for tips. Not durable across devices/users.
- **Failing Tests (MEDIUM):** `share-card.test.mjs` expects old error toast message. `sw.js` has duplicate `CACHE_NAME` declaration causing parse failure.
- **Accessibility Gaps (LOW):** eco-tips.js uses clickable `<div>` cards without button semantics. Report chart is canvas-only without screen-reader fallback.

### Suggestions
- Use `/api/carbon/stats?scope=global` or `/api/dashboard` for campus data; keep personal data separate.
- Compute calculator offset from current user records only, or label as "校园累计减碳抵消比例."
- Self-host Chart.js and html2canvas under `public/assets/vendor/`, add graceful fallback if `Chart` unavailable.
- Add Turso-backed `eco_tips` table and admin-only CRUD Netlify Functions.
- Fix failing share-card test and duplicate `CACHE_NAME` in sw.js.
- Add tests for report personal/campus scope, calculator offset scoping, and eco-tip CRUD persistence.

### Risk Assessment: **MEDIUM-HIGH**
Demo-complete, but deployed correctness not fully reliable: API-mode data scoping can misreport campus/personal carbon impact, and core visual/share features depend on external CDN scripts.

---

## Consensus Summary

### Agreed Strengths (2/2 reviewers)
- Feature completeness: all 19 requirements (RPT, FTP, ECO) are represented in the UI
- Share card abstraction is well-designed with injectable dependencies for testability
- Calculator formulas are readable with visible source citations and disclaimers
- Calculator `campusDefaults` shows strong attention to user-specific UX

### Agreed Concerns (both reviewers raised)
1. **Data scope confusion (HIGH):** Both flagged that campus-wide report and calculator offset may use wrong data scope — campus data mixed with personal data, especially in API mode. This is the highest-priority issue.
2. **localStorage-only persistence (MEDIUM):** Both noted that calculator history and eco tips only persist locally, breaking cross-device consistency.
3. **CDN reliability (HIGH per Codex / LOW per Gemini):** External CDN dependencies (Chart.js, html2canvas) create supply-chain and offline-use risks. Codex rated this higher due to SRI absence and PWA conflict.
4. **Input validation (MEDIUM):** Calculator inputs lack bounds checking or sanity limits.

### Divergent Views
- **Overall risk rating:** Gemini rated LOW (pragmatic for competition), Codex rated MEDIUM-HIGH (focus on deployed correctness). The gap reflects different priorities: time-to-demo vs production reliability.
- **Admin security:** Gemini flagged client-side route guards as HIGH risk; Codex acknowledged route guards work but noted only API mode is protected.

### Priority Action Items
1. Fix campus vs personal data scope in carbon report and calculator offset
2. Add bounds validation to calculator inputs
3. Self-host Chart.js/html2canvas or add SRI + graceful fallback
4. Fix broken tests (share-card.test.mjs, sw.js CACHE_NAME)
5. Consider Turso-backed eco_tips table for multi-device admin persistence
