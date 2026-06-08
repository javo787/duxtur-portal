# SEO Optimization - Duxtur.org

This document outlines the SEO strategies implemented in the Duxtur.org project and the roadmap for future improvements.

## 🚀 Implemented Features

### 1. Internationalization (i18n) & Hreflang
- **Multi-language support:** Tajikistan (tg), Uzbekistan (uz), Kazakhstan (kk), Kyrgyzstan (ky), and Russian (ru).
- **Hreflang implementation:** Automated `hreflang` tags using `buildAlternates` utility to ensure search engines serve the correct language version to users.
- **Localized Metadata:** Each page has unique `title` and `description` translated into all supported languages.

### 2. Structured Data (JSON-LD)
We use Schema.org structured data to help search engines understand our content better:
- **MedicalWebPage:** Used on the homepage and core landing pages.
- **Article & MedicalWebPage:** Implemented for all blog posts, including reading time, author info, and review status.
- **Physician & MedicalBusiness:** Detailed profiles for doctors, including education, experience, and contact info.
- **MedicalClinic:** Comprehensive data for clinics.
- **FAQPage:** Automatically generated from article sections to appear in "People Also Ask" results.
- **BreadcrumbList:** Clear navigation paths on all deep pages.
- **ItemList:** Used on specialty and category pages to list doctors/articles.

### 3. Sitemaps & Robots.txt
- **Dynamic Sitemap:** `sitemap.xml` is generated hourly, covering articles, doctors, clinics, specialties, and static pages across all languages.
- **Robots.txt:** Optimized rules for Googlebot and other crawlers, excluding private areas (admin, patient profiles) while allowing full access to public content.

### 4. Technical SEO
- **Canonical Tags:** Automated canonical URL generation to prevent duplicate content issues.
- **Heading Hierarchy:** Strictly enforced single `h1` per page and logical nesting of `h2`-`h4`.
- **Image Optimization:**
  - Using Next.js `next/image` for automatic resizing and WebP conversion.
  - Cloudinary integration for advanced image transformations.
  - Proper `alt` tags for all meaningful images.
- **Performance (Core Web Vitals):**
  - Optimized font loading (Geist, Inter, Fraunces) with `display: swap`.
  - Resource preloading for hero images and critical assets.
  - ISR (Incremental Static Regeneration) for fast page loads and fresh content.

---

## 🗺️ Roadmap for Future Improvements

### Short-term
- [ ] **OpenGraph Image Generation:** Automate dynamic OG image creation for every doctor and clinic profile (similar to how it's done for articles).
- [ ] **Internal Linking:** Implement a "Related Clinics" section on doctor pages and "Related Doctors" on clinic pages to improve crawl depth.
- [ ] **Social Media Meta:** Enhance Twitter/X cards with more specific data like "Specialty" or "Rating".

### Long-term
- [ ] **Backlink Strategy:** Partner with medical universities and health organizations in Central Asia to build high-quality backlinks.
- [ ] **Content Marketing:** Regular publication of high-intent medical guides (e.g., "Best pediatricians in Dushanbe").
- [ ] **Core Web Vitals Monitoring:** Continuous auditing of LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) especially on map-heavy pages.
- [ ] **User Reviews SEO:** Encourage more detailed text reviews from patients, as they provide unique, high-value long-tail keyword content.

---
*Last updated: March 2024*
