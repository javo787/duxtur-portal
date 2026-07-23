# Data Parsing & Directory Population Roadmap — Duxtur.org

This document defines how we grow the Clinic/Doctor directory across all target cities using **real, verifiable data**, on top of the `pre_imported` / claim architecture that already exists in the codebase. Goal: a new visitor — patient or doctor — should see a directory that already looks complete and established, because it *is* populated with real clinics and real doctors, not because anything is faked.

## 🧭 Current State

- **Clinic scraping** (`scripts/scrape-clinics.ts`): working end-to-end pipeline — AI extraction via ScrapeGraphAI → translate (Google Translate free endpoint) → geocode (Nominatim) → logo upload (Cloudinary) → write to MongoDB. Limited to **one source** (`ydoc.tj`), **one city** (Khujand, hardcoded), **3 pages**.
- **Doctor scraping**: does not exist yet. Only clinics are imported today.
- **Schema readiness**: both `Doctor.ts` and `Clinic.ts` already have everything needed for honest cold-start data — `status: 'pre_imported'`, `dataSource: 'scraped'`, `importSource`, `importedAt`, `isClaimed` / `claimedAt` (Doctor). `Clinic.importSource` enum already anticipates `'2gis'` as a future source.
- **Claim flow**: fully implemented and shipped (`70824d7 feat: implement doctor profile claiming and fuzzy matching`) — `checkForExistingDoctorProfile` → `findSimilarPreImportedDoctors` (fuzzy match via `string-similarity`, already a dependency) → `claimDoctorProfile`. Clinics have the equivalent via `claimClinicId` in `actions/clinic.ts`. Every claim still requires a real document/license upload and goes to `pending` for admin review (Telegram notification) — claiming a pre-imported listing is not a shortcut around verification.

**The gap is coverage, not architecture.** The claim mechanism only pays off if there's enough real data in `pre_imported` state that a doctor registering for the first time actually has a good chance of finding themselves already listed.

## ⚖️ Non-negotiable data principles

- Only real, identifiable clinics/doctors. Never create a listing that doesn't correspond to an actual place or person.
- Never fabricate `reviewCount`, `rating`/`reviewAvg`, or any other engagement signal. These stay at `0` unless a source *literally* publishes a review count — no invented testimonials, no invented "X patients booked."
- Facts (name, address, phone, specialty, working hours) are not copyrightable and are safe to extract. Original prose — bios, descriptions, About-us text — must **not** be copied verbatim; either leave those fields empty for the doctor/clinic to fill in after claiming, or write a short factual restatement in our own words.
- Every imported record keeps full provenance: `status: 'pre_imported'`, `dataSource: 'scraped'`, `importSource`, `importedAt`, and for doctors `importSourceUrl`. No manual edits disguised as scraped data.
- Prefer an official/licensed channel over unauthorized scraping wherever one exists (see 2GIS below).

## 🗂️ Data sources (phased)

### Phase 1 — Extend what already works
- Generalize `scripts/scrape-clinics.ts`: parameterize city (currently hardcoded `'Khujand'` inside `geocode()` and `city: 'Худжанд'` in the `Clinic.create` call) so it accepts `--city`, and paginate `ydoc.tj` until results run out instead of the fixed `pages = 3`.
- Add `scripts/scrape-doctors.ts` as a sibling script: same ScrapeGraphAI extraction pattern, pointed at `ydoc.tj` doctor listing pages, mapped into the `Doctor` schema (`name`, `specialty`, `workplace`, `clinicId` resolved by matching `clinicName` against clinics already imported in Phase 1).

### Phase 2 — 2GIS as an official second source
- Integrate via 2GIS's official Platform Manager (`platform.2gis.ru`) — Places/Catalog + Geocoding, paid API key — under their published API Terms (`law.2gis.ru/api-rules`), rather than scraping their site. This is both the legally clean path and the practically better one: 2GIS's business-directory coverage of Dushanbe is generally far more complete than `ydoc.tj`.
- This is likely the single highest-leverage addition, since Dushanbe (capital, largest market) isn't covered by the current scraper at all.

### Phase 3 — Public / institutional sources
- ATSMU's own public "Клинические базы" (affiliated clinical training sites) listed on `tajmedun.tj` — real, low-risk, already tied to the university.
- Individual hospital/clinic websites that list staff doctors by name + specialty — more manual effort per source, but zero ambiguity about legitimacy.
- Check whether Минздрав РТ publishes any public registry of licensed facilities or practitioners. If it exists, it's the most authoritative source available; if not, don't assume one and skip it.

### Phase 4 — Lower priority / manual review
- Public Instagram business profiles for smaller private clinics with no web presence. Structured data reliability is low here, so route these through manual review before writing to the DB rather than the automated pipeline.

## 🏗️ Technical architecture

Refactor the current single-file script into a shared pipeline so every new source follows the same shape instead of duplicating logic:

1. **Source Adapter** (`scripts/parsers/<source>.ts` — `ydoc.ts`, `twogis.ts`, `atsmu-bases.ts`, ...) → returns `RawClinic[]` / `RawDoctor[]`.
2. **Normalizer** → maps raw fields to the canonical shape, strips control characters (reuse the invisible-character cleaner already in `Clinic.ts`'s `pre('validate')` hook).
3. **Deduplicator** → replace the current exact-match check (`Clinic.findOne({ 'name.ru': raw.name })`) with fuzzy matching via `string-similarity` — already a project dependency, already used in `db-doctor.ts` — matching on name + city + address proximity so near-duplicates ("Клиника Мед-Сервис" vs "Мед Сервис клиника") don't both get imported.
4. **Enrichment** → the existing `translateName()`, `geocode()`, `uploadLogo()` helpers are reusable as-is.
5. **Writer** → upsert via the `Clinic` / `Doctor` mongoose models, always `status: 'pre_imported'`.

`scripts/scrape-clinics.ts` and the new `scrape-doctors.ts` should both call into this shared pipeline rather than each inlining their own copy of steps 2–5, as the current script does.

## ✅ Quality control
- Add a lightweight review surface (or extend the existing `admin/portal` page) to spot-check a sample of freshly-imported `pre_imported` records before a city's data is treated as "live" in search results.
- Log import batches (source + city + date + count). `CleanupLog.ts` already exists in `src/models` — consider extending it for import-run logging rather than introducing a new model.

## 🔗 Why this matters for the claim flow that's already shipped
`findSimilarPreImportedDoctors` and `claimDoctorProfile` only create value in proportion to how much real `pre_imported` coverage exists. Single-city, single-source coverage means most real doctors who register will hit "no match" and never see the claim experience at all. Coverage breadth — everything in this roadmap — is what makes the already-built claim mechanism actually pay off in practice.

## 🚦 Rollout order
- [ ] **Phase 1:** `scrape-doctors.ts` + multi-city support in `scrape-clinics.ts` (Dushanbe added alongside Khujand)
- [ ] **Phase 2:** 2GIS official API integration, Dushanbe priority
- [ ] **Phase 3:** ATSMU clinical bases + manually-vetted hospital sites
- [ ] **Phase 4:** Shared pipeline refactor (`scripts/parsers/`) + fuzzy dedup + admin QA surface
- [ ] **Phase 5 (ongoing):** Manual/social sources, periodic re-scrape for freshness

---
*Drafted by Claude (architect) for Jules implementation, per project workflow.*
*Last updated: July 2026*
