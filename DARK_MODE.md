# Dark Mode Architecture & Philosophy

This document outlines the professional implementation of Dark Mode on Duxtur.org, following modern UI/UX standards from world-leading medical and tech platforms.

## Design Philosophy

Instead of using "Pure Black" (`#000000`), we use a **Deep Navy Palette** based on the OKLCH color space. This approach:
1. **Reduces Eye Strain**: Pure black vs. white text creates high contrast that is tiring for the eyes. A deep navy (`oklch(0.17 0.022 255)`) provides a softer, more premium reading experience.
2. **Maintains Depth**: Using tinted grays allows for better perception of elevation (cards, shadows, and overlays).
3. **Medical Professionalism**: Navy blue tones are traditionally associated with trust, calmness, and professionalism in medical contexts.

## Technical Implementation

### 1. Semantic Color System
We moved away from hardcoded utility classes (like `dark:bg-slate-900`) towards semantic variables defined in `src/app/globals.css`.

- `--background`: Deep navy base (`L 0.17`).
- `--card`, `--muted`: Lighter navy (`L 0.21` and `0.25`). On dark surfaces elevation is carried by lightness, not by shadows.
- `--primary`: A light, softer blue (`L 0.76`). It is used as link colour on every surface (about 8:1) and carries **dark** text (`--primary-foreground`) on buttons. Do not put `text-white` on `bg-primary`.
- `--muted-foreground`: `L 0.74`, at least 4.5:1 on every surface. Do not use `text-slate-500` or similar on dark backgrounds.
- `--border`: A white tint at 10% opacity: edges without clutter.
- `--field`: Border of text fields and other controls, at least 3:1 against their surface (WCAG 1.4.11). The decorative `--border` is too faint for a field.
- `--ok`: Green for "verified" and "open now", lighter in the dark theme.

Contrast was calculated, not guessed: the values above pass WCAG AA for text (4.5:1) and for control boundaries (3:1).

### 2. OKLCH Color Space
We use `oklch()` for all core variables. OKLCH is perceptually uniform, making it easier to ensure consistent contrast ratios across different hues.

## Current Progress (Done)

- [x] **Deep Navy Palette**: Replaced generic dark grays with a professional navy-tinted system.
- [x] **Semantic Migration**: The home page (header, hero, topics, articles, authors, doctor block, footer) and the clinic and blog pages use only theme tokens. A hard-coded `bg-white` on the page wrapper was what made the header logo invisible in the dark theme.
- [x] **Glassmorphism Refinement**: Adjusted header and overlay blurs to look more natural on dark surfaces.
- [x] **Automatic System Sync**: Implementation in `[lang]/layout.tsx` handles `prefers-color-scheme` automatically while respecting manual overrides.
- [x] **Dynamic Maps**: Mapbox tiles now transition between `light-v11` and `dark-v11` styles dynamically when the theme changes.
- [x] **Image Dimming**: Implemented a global filter (`brightness(0.85)`) for images in dark mode to reduce eye strain, excluding logos.
- [x] **Interactive States**: Global hover/active states refined for dark mode using brightness adjustments.
- [x] **Icon Audit**: Icons use `currentColor`. The animated hero illustration and its mesh/orbit CSS were removed.

## Future Roadmap (To-Do)

- [ ] **Third-party Widgets Audit**: Ensure external widgets (like Telegram login) don't clash with the dark navy aesthetic.
- [ ] **Content-specific Dimming**: Fine-tune image dimming for specific high-contrast medical diagrams if needed.
- [ ] **PDF Export Theme**: Ensure PDF generation (e.g., for recipes or clinic profiles) uses a print-friendly light theme regardless of the UI state.

---
*Last Updated: October 2026*
