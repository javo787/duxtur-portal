# Optimization & Performance - Duxtur.org

This document details the performance and optimization strategies implemented in the Duxtur.org project, along with a roadmap for future improvements.

## 🚀 Implemented Optimizations

### 1. Image Optimization
- **Critical Asset Prioritization:** Added the `priority` attribute to high-impact images like the site logo and featured blog post images to improve Largest Contentful Paint (LCP).
- **Responsive Sizes:** Refined `sizes` attributes for `next/image` components to ensure the browser selects the most appropriate image size for the current viewport, reducing wasted bandwidth.
- **Enhanced Cloudinary Utility:** Updated `getOptimizedCloudinaryUrl` to:
  - Round widths to the nearest 100px to increase CDN cache hit rates.
  - Automatically apply `c_fill`, `f_auto`, and `q_auto` for optimal compression and format selection.
- **SVG Optimization:** Moved complex illustrations to inline SVGs where appropriate to reduce external requests.

### 2. Database & Query Performance (MongoDB)
- **Indexing Strategy:** Added missing indexes for frequently filtered and sorted fields:
  - `Doctor`: `status`, `city`, `specialty.ru`, `reviewAvg`, `reviewCount`, `experience`, `priceRange.min`, `createdAt`.
  - `Article`: `createdAt`, `category`, `slug`.
- **Lean Queries:** Applied `.lean()` to all read-only Mongoose queries. This bypasses the creation of heavy Mongoose Documents, significantly reducing memory usage and CPU time.
- **Field Selection:** Used `.select()` to retrieve only the necessary fields for listing pages, reducing the payload size between the database and the application server.
- **Read Preference:** Added `secondaryPreferred` read preference to heavy aggregation queries to distribute load in replica sets.

### 3. Caching & Headers
- **Advanced Cache-Control:** Implemented `s-maxage` and `stale-while-revalidate` for dynamic pages like doctor profiles and blog posts. This allows Vercel's Edge Network to serve cached content while updating it in the background.
- **Security Headers:** Added a strict `Content-Security-Policy` (CSP) and other security headers (`X-Content-Type-Options`, `Referrer-Policy`, etc.) to `next.config.ts` to protect users and improve trust signals.
- **Static Asset Caching:** Configured aggressive 1-year immutable caching for static assets (images, fonts, icons).

### 4. Code & Architecture
- **Directive Audit:** Audited the use of `'use client'` across components. Removed the directive from components that don't require browser-only APIs or React hooks, converting them back to Server Components to reduce the client-side JavaScript bundle.
- **Component Efficiency:** Optimized animations and transitions to use CSS where possible, reducing the execution time of initial page renders.

---

## 🗺️ Optimization Roadmap

### Short-term
- [ ] **Dynamic OG Image Generation:** Implement an edge-based OG image generator to provide high-quality, relevant social previews for every doctor and clinic.
- [ ] **Font Subsetting:** Further subset the Inter and Fraunces fonts to only include the glyphs needed for the 5 supported languages.
- [ ] **Bundle Analysis:** Run `next-bundle-analyzer` to identify and tree-shake large third-party dependencies.

### Long-term
- [ ] **Edge Middleware Localization:** Move language detection and redirection to the edge for faster initial response times.
- [ ] **Partial Prerendering (PPR):** Experiment with Next.js PPR once it's stable to combine the speed of static shells with the flexibility of dynamic content.
- [ ] **Global Database Distribution:** Explore MongoDB Atlas Global Clusters to reduce database latency for users across different regions of Central Asia.

---
*Last updated: May 2026*
