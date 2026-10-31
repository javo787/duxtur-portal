1. **Understand the Goal**: The user wants to support day (light) and night (dark) modes in the `/admin/portal`. Currently, it's explicitly styled with dark mode values (e.g., `bg-[#05070c]`, `text-white`). We need to introduce light mode using standard Tailwind variants while keeping the existing dark mode layout and aesthetics intact using `dark:` variants (or utilizing standard CSS variable values if they match).
2. **Analysis of Current State**: The portal uses hardcoded Tailwind classes, bypassing the `--background`/`--foreground` variables for a custom look:
   - Backgrounds: `bg-[#05070c]`, `bg-white/[0.015]`, `bg-white/[0.025]`, `bg-white/[0.03]`, `bg-white/[0.05]`, `bg-white/[0.06]`.
   - Text: `text-white`, `text-gray-100`, `text-gray-200`, `text-gray-300`, `text-gray-400`, `text-gray-500`, `text-gray-600`.
   - Borders/Rings: `border-white/[0.06]`, `ring-white/10`, `ring-white/20`.
   - Tones in `ui.tsx`: specific colored backgrounds (e.g., `bg-sky-400/10`, `text-sky-300`, `ring-sky-400/25`).
3. **Refactoring Strategy**:
   - Apply `dark:` prefix to the existing dark mode classes.
   - Add light mode counterparts (e.g., `bg-gray-50`, `text-gray-900`, `border-gray-200`, `bg-sky-50`, `text-sky-700`, `ring-sky-500/20`).
   - Integrate `ThemeToggle` into `AdminShell.tsx`.
   - Use `bg-background` and `text-foreground` where appropriate, but given the existing specific glassmorphism styling, it's safer to explicitly set light variants to match the standard light theme (e.g., `bg-gray-50`/`bg-white` and `text-gray-900`).
4. **Target Files**:
   - `src/app/[lang]/admin/portal/_shared/AdminShell.tsx`
   - `src/app/[lang]/admin/portal/_components/ui.tsx`
   - `src/app/[lang]/admin/portal/_components/ActionButton.tsx`
   - `src/app/[lang]/admin/portal/_shared/FormBits.tsx`
   - Review page headers in `portal/page.tsx` or similar files.
5. **Pre-commit**:
   - Call `pre_commit_instructions` tool to run necessary checks before submitting.
