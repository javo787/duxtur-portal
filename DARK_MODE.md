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
- [x] **Automatic System Sync**: Implementation in `LangLayout.tsx` handles `prefers-color-scheme` automatically while respecting manual overrides.

## Future Roadmap (To-Do)

- [ ] **Image Dimming**: Implement a global filter to slightly reduce brightness/contrast of large medical photos in dark mode.
- [ ] **Interactive States**: Fine-tune `:hover` and `:active` states for buttons to use specific navy-tinted overlays.
- [ ] **Dynamic Maps**: Ensure Mapbox/Leaflet tiles transition to a dark-mode variant when the theme changes.
- [ ] **Icon Audit**: Review all medical icons to ensure they don't lose detail on dark backgrounds.

---
*Last Updated: February 2024*
