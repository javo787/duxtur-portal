<!--
CONSTITUTION SYNC IMPACT REPORT:
- Version change: none -> 1.0.0
- List of modified principles:
  - PRINCIPLE_1: [PRINCIPLE_1_NAME] -> I. Targeted Minimal Code Changes
  - PRINCIPLE_2: [PRINCIPLE_2_NAME] -> II. Next.js App Router and Server Actions
  - PRINCIPLE_3: [PRINCIPLE_3_NAME] -> III. Database Integrity with MongoDB and Mongoose
  - PRINCIPLE_4: [PRINCIPLE_4_NAME] -> IV. Multilingual Portal Integration
  - PRINCIPLE_5: [PRINCIPLE_5_NAME] -> V. Medical Verification and Trust (E-E-A-T)
- Added sections:
  - Technical and Environment Constraints
  - Development and Review Workflow
- Removed sections: none
- Templates requiring updates:
  - C:/duxtur-portal-main/.specify/templates/plan-template.md: ✅ updated
  - C:/duxtur-portal-main/.specify/templates/spec-template.md: ✅ updated
  - C:/duxtur-portal-main/.specify/templates/tasks-template.md: ✅ updated
- Follow-up TODOs: none
-->

# Duxtur.org Constitution

## Core Principles

### I. Targeted Minimal Code Changes
Prioritize targeted, minimal code modifications over large-scale architectural rewrites. When adding features or fixing bugs, work within the existing patterns and structures of the codebase. Refactoring must be localized, justified, and focused purely on the scope of the change. Avoid rewrite-first mentalities and maintain codebase compatibility at all costs.

### II. Next.js App Router and Server Actions
Utilize the Next.js App Router, SSR, and Server Actions effectively. Structure routes cleanly using standard folder structures under src/app/[lang]. Layouts must be reusable, and API boundaries clearly defined. Follow existing state management and page structure patterns to keep the frontend clean and fast.

### III. Database Integrity with MongoDB and Mongoose
Ensure all database interactions use Mongoose models to enforce data integrity. Do not bypass schemas. Maintain text indexes for multi-lingual search, and geo-indexes (2dsphere) for clinic/doctor mapping. Optimize database queries to prevent slow-downs or connection leaks.

### IV. Multilingual Portal Integration
Support all five Central Asian target languages (Russian, Uzbek, Tajik, Kazakh, Kyrgyz). Retrieve and render translations strictly via getT(), useT(), and T() helpers, referencing keys defined in i18n locale files. Do not hardcode user-facing strings; verify all translation keys are present in dictionaries.

### V. Medical Verification and Trust (E-E-A-T)
Design workflows around verification and trust: doctors must be verified before approval, clinics must provide licenses, and appointments must be securely booked and validated. All content must support medical verification fields (aiGenerated, isVerified, reviewedBy) to align with E-E-A-T principles for search engine trust.

## Technical and Environment Constraints
- **Language & Frameworks**: Next.js 16, React 19, Mongoose 9, Tailwind CSS 4, and TypeScript.
- **Database**: MongoDB 5.0+ with full-text search indexes.
- **Third-Party Services**: NextAuth v5 for authentication, Resend for email notifications, Cloudinary for media uploads, and Telegram Bot API for real-time notifications.
- **Localization**: Strictly dynamic client-side and server-side localization with fallback to Russian if translations are missing.

## Development and Review Workflow
- **Code Review**: Every pull request must be checked against this Constitution.
- **Verification**: Functional requirements must have clear acceptance criteria.
- **Documentation**: Code files should preserve existing docstrings and comments. Update sitemaps and localized dictionaries as new features are added.

## Governance
- This Constitution represents the source of truth for Duxtur.org architecture and governance.
- Any deviations or exceptions from these principles must be explicitly justified in the Complexity Tracking table of the implementation plans.
- Amendments to these principles require updating this document and bumping its version (Major for backward-incompatible principles, Minor for new guidelines, Patch for wording/typos).

**Version**: 1.0.0 | **Ratified**: 2026-06-06 | **Last Amended**: 2026-06-06
