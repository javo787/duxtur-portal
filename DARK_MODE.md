# Dark Mode Architecture & Philosophy

This document outlines the professional implementation of Dark Mode on Duxtur.org, following modern UI/UX standards from world-leading medical and tech platforms.

## Design Philosophy

Instead of using "Pure Black" (`#000000`), we use a **Deep Navy Palette** based on the OKLCH color space. This approach:
1. **Reduces Eye Strain**: Pure black vs. white text creates high contrast that is tiring for the eyes. A deep navy (`oklch(0.12 0.02 255)`) provides a softer, more premium reading experience.
2. **Maintains Depth**: Using tinted grays allows for better perception of elevation (cards, shadows, and overlays).
3. **Medical Professionalism**: Navy blue tones are traditionally associated with trust, calmness, and professionalism in medical contexts.

## Technical Implementation

### 1. Semantic Color System
We moved away from hardcoded utility classes (like `dark:bg-slate-900`) towards semantic variables defined in `src/app/globals.css`.

- `--background`: Deep navy base.
- `--card`: Slightly lighter navy for elevation.
- `--primary`: Refined blue for high visibility against dark backgrounds.
- `--border`: Subtlest tint of white (8-12% opacity) to define edges without clutter.

### 2. OKLCH Color Space
We use `oklch()` for all core variables. OKLCH is perceptually uniform, making it easier to ensure consistent contrast ratios across different hues.

## Current Progress (Done)

- [x] **Deep Navy Palette**: Replaced generic dark grays with a professional navy-tinted system.
- [x] **Semantic Migration**: Updated core layout components (`HomeHeader`, `HomeFooter`) to use CSS variables.
- [x] **Glassmorphism Refinement**: Adjusted header and overlay blurs to look more natural on dark surfaces.
- [x] **Automatic System Sync**: Implementation in `[lang]/layout.tsx` handles `prefers-color-scheme` automatically while respecting manual overrides.
- [x] **Dynamic Maps**: Mapbox tiles now transition between `light-v11` and `dark-v11` styles dynamically when the theme changes.
- [x] **Image Dimming**: Implemented a global filter (`brightness(0.85)`) for images in dark mode to reduce eye strain, excluding logos.
- [x] **Interactive States**: Global hover/active states refined for dark mode using brightness adjustments.
- [x] **Icon Audit**: Refined key hero illustrations and icons to use theme-aware colors (variables and `currentColor`).

## Future Roadmap (To-Do)

- [ ] **Third-party Widgets Audit**: Ensure external widgets (like Telegram login) don't clash with the dark navy aesthetic.
- [ ] **Content-specific Dimming**: Fine-tune image dimming for specific high-contrast medical diagrams if needed.
- [ ] **PDF Export Theme**: Ensure PDF generation (e.g., for recipes or clinic profiles) uses a print-friendly light theme regardless of the UI state.

---
*Last Updated: March 2024*
