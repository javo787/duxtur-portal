---
name: take-task
description: Start a NEW task on a usage-limited subscription. Read the minimum, record the task and a staged plan in a handoff file, open a draft PR BEFORE coding, then work in checkpointed stages so a limit never loses work. Use at the start of any new task.
---

# Start a task (relay-safe)

The session can be cut off by a usage limit at any moment. Unpushed work dies. Another account continues from git + the PR only.

0. **Check the queue:** `git fetch --all --prune && npm run queue`. If a PR already covers this task, stop and use `continue-task`.
1. **Branch:** `git switch -c claude/<topic> origin/main`. Never work on main.
2. **Read the minimum:** grep first, then Read with offset/limit. Never read a whole large file or `package-lock.json`. Before writing Next.js code read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md: this is not the Next.js you know; run `npm ci` once if node_modules is missing).
3. **Write the handoff NOW**, before coding: copy `.agent-sync/handoff/TEMPLATE.md` to `.agent-sync/handoff/YYYY-MM-DD-<branch-with-dashes>.md`. Fill: Task (owner's words verbatim), Assumptions, Definition of done, Plan (stages that each end in a working state), Driver (you, now). Keep it short; no secrets (public repo).
4. **First checkpoint = draft PR:** `npm run checkpoint -- "plan"`. Now the work is visible and resumable.
5. **Work stage by stage.** After each stage: tick the Plan item, update `Done`, `Next step` and `What we learned`, then `npm run checkpoint -- "stage N: what is done"`. Never go more than ~15 minutes or one stage without a checkpoint.
6. **Under a limit** (rate-limit warning, session near its end, or you must stop): update `Next step`, set `Driver:` to `free`, `npm run checkpoint -- "stopped: <what is left>"`. A rough checkpoint beats a lost one.
7. **When the Plan is complete:** use `finish-work`.

Checks: `npm run typecheck`, `npx vitest run <file>`, `npx eslint <changed .ts/.tsx files>` (CI lints only changed files; never run the whole-repo lint, it has legacy errors). Do not run `npm run build` locally; CI does it (needs MongoDB).
