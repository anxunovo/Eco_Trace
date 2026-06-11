# SEO Audit Report for Stu Eco Trace

## Executive Summary
This report presents the findings of an SEO audit conducted for the Stu Eco Trace production site (https://stu-eco-trace.netlify.app). The site functions primarily as an SPA (Single Page Application) built with Vue. While the core functionality is intact, critical SEO elements such as a sitemap, `robots.txt`, structured data, and dynamic meta tags are currently missing or under-utilized, limiting organic discoverability and search engine ranking.

## 1. Meta Tags Verification
*   **Title Tags:** Currently, pages have dynamic title tags implemented via Vue Router in `app.js`. This is good.
*   **Meta Descriptions:** There is a static meta description in `index.html`. However, dynamic meta descriptions for individual routes/pages are missing.
*   **Open Graph (OG) Tags:** Missing. There are no `og:title`, `og:description`, `og:image`, or `og:url` tags, which will result in suboptimal display when URLs are shared on platforms like WeChat or Facebook.
*   **Twitter Card Tags:** Missing.
*   **Canonical URLs:** Missing. Given the SPA nature, adding canonical URLs for each specific path helps consolidate link equity.

## 2. Sitemap Verification
*   **Status:** Missing.
*   **Observation:** The `/sitemap.xml` file does not exist.
*   **Recommendation:** Create a static `sitemap.xml` referencing core public paths (e.g., `/`, `/listings`, `/impact`).

## 3. Robots.txt Verification
*   **Status:** Missing.
*   **Observation:** The `/robots.txt` file does not exist.
*   **Recommendation:** Create a `robots.txt` file allowing crawlers to index the site and pointing them to the new `sitemap.xml`.

## 4. Structured Data (Schema.org)
*   **Status:** Missing.
*   **Observation:** There is no JSON-LD structured data on the homepage or listings pages.
*   **Recommendation:** Implement Organization schema on `index.html` to help search engines understand the entity behind the website. For individual listings (if crawled/rendered), Product or Offer schema would be ideal, but for the immediate static structure, an Organization schema is a solid first step.

## 5. Content SEO
*   **Status:** Needs Improvement.
*   **Observation:** Heading hierarchies are present in components, but because content is loaded dynamically via JavaScript, search engines relying strictly on initial HTML payloads might miss it.
*   **Recommendation:** Ensure semantic HTML tags (`<header>`, `<main>`, `<footer>`, `<h1>`, `<h2>`) are correctly utilized within Vue components. Alt text for images should be consistently applied.

## 6. Technical SEO
*   **Status:** Good.
*   **Observation:** Hosted on Netlify, HTTPS is enforced automatically. Being a SPA, page speed and mobile responsiveness are handled well by the modern architecture.

## 7. Social Media Optimization
*   **Status:** Poor.
*   **Observation:** Due to missing OG and Twitter tags, social sharing cards will fall back to default, potentially unappealing displays (often just the static `<title>` and `<meta name="description">`).

## Action Plan & Improvements to Implement

1.  **Create `robots.txt`**: Add to `new-site/public/robots.txt` to allow all user agents and link to the sitemap.
2.  **Create `sitemap.xml`**: Add to `new-site/public/sitemap.xml` listing primary static routes (`/`, `/listings`, `/impact`).
3.  **Enhance `index.html`**:
    *   Add generic Open Graph tags (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`).
    *   Add Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`).
    *   Add base Canonical URL tag `<link rel="canonical" href="https://stu-eco-trace.netlify.app/" />`.
    *   Add Organization JSON-LD snippet.
4.  **Update `app.js` Route Guards**: Modify the `afterEach` hook to dynamically update the `<link rel="canonical">` and `<meta name="description">` to match the active route's context.

By addressing these immediate technical SEO gaps, the application will be much better positioned for indexing and proper display across social networks.