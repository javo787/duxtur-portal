---
name: karpathy-discipline
description: Working discipline for a limited free-plan session - think before coding, smallest change, surgical edits, token-cheap reading, goal-driven verification. Apply to any code change, review or refactor.
---

# Discipline (anti-overengineering, token-cheap)

1. **Think before coding.** State assumptions in one line. If a request has several readings, say so and pick the simplest; ask the owner only when a wrong guess would be costly.
2. **Simplicity first.** The minimum code that solves the task. No abstractions, options or "flexibility" nobody asked for. If 50 lines do it, do not write 200.
3. **Surgical changes.** Touch only what the task needs; match the existing style; do not refactor or reformat neighbouring code. Mention unrelated problems, do not fix them. Remove only the unused code YOUR change created.
4. **Goal-driven.** Turn the task into a checkable result (a failing test that passes, a typecheck that is clean) and loop until it holds. Do not report "done" without running the check.
5. **Read less (tokens are the budget).**
   - Grep/glob first, then Read with offset/limit. Do not re-read a file already in context or one you just wrote.
   - Never read lockfiles, `.next/`, generated files, or logs in full (`tail`/`grep` them).
   - Batch independent tool calls in one turn. Prefer one precise command over several exploratory ones.
   - Handoff file + `git diff` replace re-exploring the codebase when resuming.
   - Keep replies short: no restating the task, no summaries of what the diff already shows.
6. **Checkpoint early.** A pushed rough stage beats an unpushed perfect one (`npm run checkpoint`).
