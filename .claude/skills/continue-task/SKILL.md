---
name: continue-task
description: Resume work that another account or session started and left unfinished (usage limit, cut-off). Find the draft PR, take it over without colliding, restore context from the handoff file and git instead of re-reading the codebase. Use when told to continue a task or when the queue shows FREE work.
---

# Continue someone else's task

1. **Find it:** `git fetch --all --prune && npm run queue`. Pick the PR (FREE = no commits for 30+ min; IN PROGRESS means someone may still be driving, so ask the owner before taking it).
2. **Take it:** `gh pr comment <number> --body "Taking over: <who>"` (without gh, comment in the browser). Then `git switch <branch>` (or `git switch -c <branch> origin/<branch>`) and `git pull --ff-only`. Never force-push.
3. **Restore context cheaply, in this order:**
   - the handoff file `.agent-sync/handoff/*-<branch>.md` (Task, Plan, `What we learned`, `Next step`): this is your memory, trust it;
   - `git log origin/main..HEAD --stat` and `git diff origin/main...HEAD --stat`;
   - only then open the specific files named in `Next step`. Do NOT re-read the codebase "to understand".
   If there is no handoff file (autosave stub): read the diff, write the handoff yourself (Task from the PR/Issue, Plan, what is left), checkpoint.
4. **Check the state before adding:** `git merge origin/main` if behind; `npm run typecheck`. Autosave commits may not build: fix that first.
5. **Set the Driver:** edit the handoff (`Driver: <you> since <time>`, add a Session log line), `npm run checkpoint -- "taking over"`.
6. **Continue from `Next step`**, checkpointing after every stage (see `take-task` steps 5-6). When the Plan is done: `finish-work`.
