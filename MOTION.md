# Motion

How things move on Duxtur.org, and what must stay true when you add more. The tokens and keyframes live at the end of `src/app/globals.css`.

## Rules

1. **Purpose.** Motion shows that something appeared, responded or changed. No decorative loops: nothing animates forever (WCAG 2.2.2).
2. **Only `transform` and `opacity`.** They run on the compositor, so they stay smooth and never shift the layout (CLS 0). Do not animate `width`, `height`, `top`, `margin` or `background-position`.
3. **Time.** Feedback (press, hover) 100-200 ms. UI changes (menu, list, icon) 200-300 ms. Entrances of content up to 650 ms. Nothing in a flow the user waits for is longer than 500 ms.
4. **One curve.** `ease-premium` (`cubic-bezier(0.22, 1, 0.36, 1)`): it starts fast and settles slowly, so the result is felt as immediate. Never `linear`. In plain CSS use `var(--motion-ease)`.
5. **Content first.** The server HTML is the finished, visible page. No JavaScript, no animation support, a crawler or print: everything is readable.
6. **Reduced motion.** With `prefers-reduced-motion: reduce` there is no movement at all: a global block in `globals.css` removes every animation and transition, `[data-reveal]` is forced visible, and `ScrollReveal` and the theme cross-fade do not run.

## What exists

| Where | Effect | How |
| --- | --- | --- |
| Hero | Blocks rise one after another (70 ms apart, the heading first), the glow fades in | CSS only: `.hero-rise` with `--i`, `.hero-glow` |
| Sections below the fold | Fade and 16 px rise when they scroll into view | `data-reveal=""` on the element, `<ScrollReveal />` once per page |
| Header | Transparent at the top, gets its background and border after 8 px of scroll | `useSyncExternalStore` on scroll |
| Mobile menu | Opens and closes by height; links are not focusable while closed | `grid-template-rows` 0fr/1fr + `visibility` |
| Theme toggle | Sun and moon turn into each other; the whole page cross-fades | View Transitions API, with a plain switch as a fallback |
| Language list | Appears from its button | `tw-animate-css` |
| Buttons | Press feedback (`scale 0.98`) | `btnPrimary`, `btnQuiet` |
| Cards, chips, links | Small lift, image zoom, arrow nudge, border darkening | Tailwind transitions with `ease-premium` |

## Using it

- **Reveal a block:** add `data-reveal=""` to a server-rendered element and make sure the page renders `<ScrollReveal />`. For items in a row add `style={{ '--i': index % 3 }}` (70 ms steps; keep the index small so a late item never waits).
- **Do not** put `data-reveal` on something that is already above the fold on every screen: it is skipped anyway, but it is noise.
- **Do not** hide content with `opacity-0` in the server HTML. If it needs JavaScript to become visible, it will not be indexed or read on a slow connection.
- **Before adding an effect,** ask which of the rules above it breaks. If the answer is "it is just nice", leave it out.

## Weight and bad connections

Measured on this repository (esbuild + Tailwind, gzip, shared libraries excluded):

- The motion itself is about 1 KB of JavaScript (`ScrollReveal`, the theme toggle) and **adds no requests**: no animation library, no Lottie, no video, no extra fonts.
- The stylesheet got smaller, not bigger, because the old home page CSS (mesh blobs, orbits, glass cards) was removed.
- The home route's own client JavaScript went from about 117 KB to about 3 KB: `framer-motion` is no longer imported there, and the header receives its labels from the server instead of calling `useT`. Rule: **a client component must not call `useT`**, because that ships all five dictionaries (about 64 KB gzipped) to the browser. Translate on the server and pass strings down.
- Tested with scripts blocked and with scripts arriving 6 seconds late after the visitor scrolled to the bottom: everything is readable the whole time, and nothing already scrolled past is hidden when the script finally runs.
- Known limit: without JavaScript the burger menu does not open (the footer has all the links).
