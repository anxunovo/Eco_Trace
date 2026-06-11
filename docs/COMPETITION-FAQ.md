# Competition FAQ & Defensive Playbook

This document prepares the team for rigorous questioning from the judges panel.

---

## 1. Core Logic & Value Proposition

### Q: "How accurate is your carbon estimation?"
**A:** Our carbon engine utilizes a dual-channel estimation model (`per_kg` and `per_item`). It's based on aggregated lifecycle assessment (LCA) averages for common consumer categories (Electronics, Clothing, Books). While it provides an *estimate* rather than an exact scientific measurement, it is highly effective for relative comparison and gamification. By rounding to a single decimal place, we ensure the data is digestible for users, driving the primary goal: behavioral change toward sustainability.

### Q: "What happens if the AI incorrectly categorizes an item?"
**A:** The AI acts as an accelerator, not an absolute authority. Our "Human-in-the-Loop" design ensures that after the AI pre-fills the Publish form (Title, Category, Weight), the user retains full control to review and edit any field before submission. We also implemented a robust fallback mechanism; if the AI service times out or fails, the system gracefully degrades, allowing standard manual entry without blocking the user journey.

## 2. Technical Stack & Architecture

### Q: "Why did you choose this specific tech stack (Vue + Netlify + Turso)?"
**A:** We optimized for zero-configuration scalability and rapid development:
- **Frontend (Vue SPA):** Provides a reactive, app-like experience without the overhead of a heavy build step (we serve it directly).
- **Backend (Netlify Functions V2):** Serverless architecture means we pay only for what we use, scaling instantly with traffic spikes (e.g., during end-of-semester move-out periods).
- **Database (Turso Edge DB):** Built on libSQL, it offers lightning-fast read access at the edge, crucial for a fast-browsing marketplace experience, and seamlessly integrates with our serverless backend via HTTP.

### Q: "How does the platform scale if the entire campus uses it simultaneously?"
**A:** The architecture is inherently horizontally scalable. Netlify handles global CDN distribution for the static assets and auto-scales the serverless API functions. The database, Turso, pushes data to edge locations, minimizing latency. We also implemented a "hybrid data strategy" (using `localStorage` state combined with background API syncing) to reduce unnecessary network requests and ensure the app remains responsive even under heavy load.

## 3. Safety & Moderation

### Q: "How do you handle food safety for the 'Food' category?"
**A:** Food safety is a critical concern. We handle it through three mechanisms:
1. **Time Limits:** Food listings require a strict `latestPickupTime`. The system automatically transitions the listing status to 'EXPIRED' once this time passes.
2. **UI Warnings:** Explicit visual warnings are displayed on food category items.
3. **Moderation:** The admin dashboard allows rapid removal of violating listings.

### Q: "How do you prevent malicious uploads or inappropriate content?"
**A:** Currently, we rely on the underlying AI vision model (ZhipuAI) which includes basic content filtering capabilities. For the future roadmap, we plan to implement a dedicated pre-processing moderation layer to flag NSFW or inappropriate images before they ever reach the platform, alongside a user reporting system.

## 4. Business & Future Roadmap

### Q: "How do you plan to sustain or monetize this platform?"
**A:** For the immediate term, the goal is campus adoption, potentially sustained by university sustainability grants or student union funding. Future monetization avenues could include partnering with local campus businesses for targeted, eco-friendly promotions using the aggregated (and anonymized) "Eco Points" system, or licensing the white-label platform to other universities.