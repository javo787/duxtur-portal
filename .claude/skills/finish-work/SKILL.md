---
name: finish-work
description: Finish a task - verify, merge main, finalize the handoff and PR, hand it to the owner for review. Use when every Plan item is done, never before.
---

# Finish a task

1. **Sync:** `git fetch origin && git merge origin/main`. Resolve conflicts carefully; do not discard the other side's work.
2. **Verify** what CI will check: `npm run typecheck`; `npx vitest run` for the tests of the changed code; `npx eslint <changed .ts/.tsx files>`; `node scripts/check-secrets.js --changed`. The full `npm run build` is left to CI (needs MongoDB).
3. **Review your own diff:** `git diff origin/main...HEAD`. Remove debug code, stray files, unrelated reformatting. New UI strings: every locale (ru, uz, tg, kk, ky) has the key, or list the missing locales in the handoff `Risks`.
4. **Finalize the handoff:** all Plan items ticked, `Status: awaiting review`, `Driver: free`, fill `How to verify` and `Risks and overlaps`, add the final Session log line.
5. **Last checkpoint:** `npm run checkpoint -- "ready for review"`.
6. **Hand over:** `gh pr ready <number>` (the owner merges; you never merge or push to main). Tell the owner in 3-5 lines: what changed, how to verify, what needs their decision.
