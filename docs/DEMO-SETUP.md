# EcoTrace Pre-Demo Checklist

This checklist ensures the environment is perfectly staged for a flawless 10-minute competition demo. Complete these steps 30-60 minutes before the presentation.

## 1. Environment & Network
- [ ] **Verify Network Connection:** Ensure stable internet access for both the main presentation device and any secondary devices (for mobile responsiveness demo).
- [ ] **Clear Browser State:**
  - Clear cache, cookies, and `localStorage` to ensure a fresh experience for the "new user" registration flow.
  - *Tip: Use an Incognito/Private window for the primary demo to guarantee a clean slate.*
- [ ] **Wake Up Servers:** Visit the production URL (`https://stu-eco-trace.netlify.app`) to wake up any sleeping Netlify functions or edge database connections to prevent cold-start delays during the live demo.

## 2. Data Preparation
- [ ] **Seed Data Loaded:**
  - Ensure the database has a healthy amount of varied listings (different categories, conditions, and statuses).
  - If necessary, run the initialization/seed script (`/api/init-db` via POST, if enabled in the demo environment).
- [ ] **Impact Stats Populated:** Verify the `/impact` dashboard displays non-zero global carbon savings and a populated category breakdown graph.

## 3. Account Readiness
- [ ] **Primary Demo Account (The "Buyer"):**
  - Have a pre-existing account ready for Act 4 (Expressing Interest).
  - **Nickname:** `demo1234` (or similar).
  - Ensure this account is logged in on a *separate browser* or secondary device.
- [ ] **Admin Account (Optional):**
  - If Act 5 includes a deep dive into the admin panel, ensure an account with admin privileges is staged and logged in on a hidden tab.

## 4. Media Assets (The AI Demo)
- [ ] **Sample Images Prepared:**
  - Have a dedicated folder on the desktop containing 2-3 clear, high-quality images ready for the Act 3 AI upload demo.
  - **Recommended Images:**
    - A clear photo of a stack of textbooks.
    - A photo of a small electronic device (e.g., a keyboard or mouse).
    - *Avoid blurry images or items that are difficult to categorize to ensure the AI responds quickly and accurately.*
- [ ] **Image Formats:** Ensure images are in standard web formats (.jpg, .png) and under the file size limit (e.g., < 5MB) to ensure fast uploads.

## 5. Fallback Plan
- [ ] **Local Environment Ready:** If internet fails, have a local instance running (`npm start` equivalent) pointing to a local database.
- [ ] **Offline Video:** Have a pre-recorded video of the end-to-end 10-minute demo queued up just in case of catastrophic technical failure.