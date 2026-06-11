# EcoTrace (̼ѭУ԰) - Competition Demo Script

**Total Time:** 10 minutes
**Presenter:** [Your Name]
**Target Audience:** Competition Judges
**Goal:** Showcase AI integration, end-to-end user journey, carbon estimation, and platform usability.

---

## Act 1: Onboarding & Identity (2 minutes)
*Objective: Show frictionless entry and personalized experience.*

1. **Start on Landing Page (`/`)**
   - **Narration:** "Welcome to EcoTrace, the AI-powered campus second-hand marketplace designed to reduce our carbon footprint."
   - **Action:** Briefly show the hero section and value proposition.
2. **User Registration**
   - **Narration:** "Let's join the platform as a new student."
   - **Action:** Click "Login/Register". Enter a nickname (e.g., `EcoStudent`) and password.
   - **Highlight:** Point out the seamless auto-login right after registration.
3. **Personalization & Navigation**
   - **Narration:** "Notice how the navigation bar instantly updates to greet the user."
   - **Action:** Hover over the profile icon in the navbar.
   - **Highlight:** Mention that the default campus is automatically set, tailoring the experience to the student's location.

## Act 2: Discovery & Browsing (2 minutes)
*Objective: Demonstrate responsive design, robust filtering, and detailed item views.*

1. **Marketplace Overview (`/listings`)**
   - **Narration:** "Here in the marketplace, students can easily find items they need, preventing unnecessary new purchases."
   - **Action:** Navigate to the "Listings" page.
2. **Filtering & Responsive Layout**
   - **Narration:** "Whether on a laptop or a mobile device, the experience is seamless."
   - **Action:** Resize the browser window to mobile width, then back to desktop. Use the category filters (e.g., Books, Electronics) to refine the view.
3. **Listing Details**
   - **Narration:** "Let's look at this specific item."
   - **Action:** Click on a listing card.
   - **Highlight:** Scroll through the details, pointing out the item condition, pickup location, and any food safety warnings if applicable.

## Act 3: AI-Powered Publishing (3 minutes)
*Objective: The 'Wow' factor. Show ZhipuAI integration for auto-filling and carbon estimation.*

1. **Initiate Publish (`/publish`)**
   - **Narration:** "Now, let's list an item. This is where our AI engine really shines."
   - **Action:** Click "Publish" in the navbar.
2. **Image Upload & AI Recognition**
   - **Action:** Upload a sample photo (e.g., a stack of textbooks or a monitor).
   - **Narration:** "Instead of manually filling out tedious forms, our AI analyzes the image..."
   - **Highlight:** Wait for the AI to process. Point out how it automatically populates the **Title**, **Category**, and estimates the **Weight**.
3. **Carbon Estimation**
   - **Narration:** "...and crucially, it immediately calculates the estimated carbon footprint saved by reusing this specific item."
   - **Action:** Highlight the carbon savings badge on the publish form.
4. **Complete the 4-Step Process**
   - **Action:** Quickly click through the remaining steps (Condition, Details, Preview) and submit the listing.

## Act 4: Transaction & Impact (1 minutes)
*Objective: Show the lifecycle completion and immediate positive feedback.*

1. **Expressing Interest**
   - **Action:** Open another browser window/incognito mode (logged in as `demo1234`). Find the newly published listing and click "I want this".
2. **Confirming Completion**
   - **Action:** Switch back to the original user (`EcoStudent`) and navigate to "My Listings".
   - **Narration:** "Once the item changes hands, the owner marks it as completed."
   - **Action:** Click "Mark Completed" on the listing.
3. **The Reward**
   - **Highlight:** Draw attention to the "Carbon Saved!" toast notification.
   - **Narration:** "The user immediately sees their tangible environmental impact."

## Act 5: Analytics & Administration (1 minutes)
*Objective: Prove the system scales and tracks meaningful data.*

1. **Impact Dashboard (`/impact`)**
   - **Action:** Navigate to the Impact page.
   - **Narration:** "This dashboard aggregates the carbon savings across the entire campus, gamifying sustainability."
   - **Highlight:** Show the global stats and categories breakdown.
2. **User Profile (`/me`)**
   - **Action:** Navigate to the Profile page. Show personal stats and Eco Points.
3. **Admin Panel (`/admin`)**
   - **Action:** Briefly navigate to the admin dashboard (if configured).
   - **Narration:** "Administrators have a birds-eye view to manage users, monitor listings, and ensure platform safety."

## Closing & Q&A (1 minutes)
*Objective: Summarize value and open the floor.*

- **Key Metrics:** Summarize the core value (e.g., "In just a few clicks, we diverted waste and tracked exactly how much CO2 was saved.")
- **Tech Stack:** Briefly mention the modern stack: Vue.js SPA, Netlify Serverless Functions, Turso Edge Database, and ZhipuAI.
- **Future Roadmap:** Mention 1-2 future features (e.g., campus integrations, expanded AI categories).
- **Call to Action:** "Thank you. We are now open for questions."