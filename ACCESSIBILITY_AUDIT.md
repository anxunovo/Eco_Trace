# Accessibility Audit Report

## Methodology
The automated accessibility audit was conducted using Lighthouse (axe DevTools) against the local verification environment mimicking the production site (`https://stu-eco-trace.netlify.app/`). The major pages tested were:
- Home (`/`)
- Listings (`/listings`)
- Publish (`/publish`)
- Impact (`/impact`)
- Me (`/me`)
In addition, a code-level review was conducted to ensure keyboard navigation, screen reader compatibility, and form accessibility are accounted for correctly.

## Findings and Fixes

### 1. Document Structure & Screen Reader Testing
- **Violation:** The document was missing a `<main>` landmark element. One main landmark helps screen reader users navigate a web page.
- **Fix:** Wrapped the router outlet (`<router-view>`) in `new-site/public/assets/app.js` and the fallback loading content in `new-site/public/index.html` inside a `<main>` tag.
- **Other checks:**
  - Standard HTML elements with semantic meaning are used where possible.
  - Image alt texts are conditionally bound correctly.
  - Dynamic content updates (like toast messages via `ToastStack`) rely on proper Vue state mutations that are visually updated; further `aria-live` considerations may be helpful.

### 2. Color Contrast
- **Violation:** Background and foreground colors did not have a sufficient contrast ratio.
  - The bottom navigation bar text (`.tab-item`) had a contrast ratio of ~2.56.
  - The "已过期" tags on listing cards had a contrast ratio of ~3.76.
- **Fix:**
  - Changed `.tab-item` inactive text color from `#94a3b8` to `#64748b` in `new-site/public/assets/styles.css` to meet the WCAG AA requirement of 4.5:1.
  - Changed the red badge background from `.bg-red-500` to `.bg-red-700` in `new-site/public/assets/components.js`.

### 3. Viewport Scalability & Mobile Accessibility
- **Violation:** Disabling zooming is problematic for users with low vision who rely on screen magnification to properly see the contents of a web page.
- **Fix:** Removed the `user-scalable=no` attribute from the `<meta name="viewport">` tag in `new-site/public/index.html`.
- **Other checks:**
  - Touch targets for elements like `a.tab-item` and `button` elements are well-sized due to Tailwind utility classes (e.g., `p-4`, `min-h-[44px]` implicit from padding).

### 4. Keyboard Navigation
- Interactive elements like tabs, links, buttons, and inputs are focusable by default because native `<button>`, `<a>`, and `<input>` elements are used throughout the application.
- Focus rings are provided by browser defaults or Tailwind utility classes.
- Modals and dialogs (e.g., in `new-site/public/assets/components.js`) use the `v-if` directive to control visibility and provide overlay actions, but do not implement a focus trap. Consider adding a focus trap and `Escape` key listeners for better modal accessibility.

### 5. Form Accessibility
- Standard `<input>` and `<textarea>` fields are used inside forms.
- Labels are visually placed but mostly lack the explicit `for` attribute tying them to input `id`s. This is partially mitigated by wrapping, but could be improved.
- Form validation provides clear feedback via toast messages. Required fields are enforced in the submit logic.

## Recommendations for Future Audits
- Automated scans do not catch all accessibility issues. While Lighthouse reports a score of 100 on the tested pages, further manual testing involving keyboard navigation flows (tab order) and actual screen reader use (NVDA/VoiceOver) by humans may reveal further opportunities for improvement, such as ARIA roles on dynamically loaded state.
- Improve form accessibility by explicitly adding `id` and `for` associations between `<label>` and form inputs, especially in `PublishPage`.
- Implement focus trapping and explicit `aria-modal="true"` for dialog components.

## Prioritized List of Fixed Issues
1. Critical: Added `<main>` landmark element.
2. Serious: Removed `user-scalable=no` to allow zooming.
3. Serious: Improved text-to-background contrast ratio across elements.
