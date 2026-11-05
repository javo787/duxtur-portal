<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Account relay (usage limits)

Work moves between accounts/agents whose sessions end at a usage limit and share NO memory. Shared state = git, GitHub (branches, PRs, Issues) and repo files only.

- New task: skill `take-task`. Resuming another session's work: `continue-task`. Done: `finish-work`. Check open work first: `git fetch --all --prune && npm run queue`.
- Work on a `claude/<topic>` branch, never on `main`; never force-push; the owner merges.
- Push early: `npm run checkpoint -- "note"` = commit + push + draft PR. Run it after every stage and before any long operation. Unpushed work is lost when the session dies.
- Handoff file `.agent-sync/handoff/YYYY-MM-DD-<branch-with-dashes>.md` (from `TEMPLATE.md`) is the shared memory: task verbatim, plan, what we learned, next step. It becomes the PR body. Update it at every checkpoint; set `Driver: free` when you stop.
- Resuming: read the handoff and `git diff origin/main...HEAD` BEFORE any other file. Do not re-read the codebase.
- This repo is PUBLIC: never put secrets, tokens, `.env` values, personal data or chat excerpts into files, commits, PRs or handoffs. Checkpoint refuses to commit if it finds a secret.
- CI lints only changed `.ts/.tsx` files (legacy lint errors exist): run `npx eslint <changed files>`, `npm run typecheck`, `npx vitest run <file>`; leave `npm run build` to CI (needs MongoDB).
- Keep changes minimal and read less: skill `karpathy-discipline`.
