<!-- Copy to .agent-sync/handoff/YYYY-MM-DD-<branch-with-slashes-replaced-by-dashes>.md, e.g. 2026-11-05-claude-booking-form.md.
     Everything below is copied into the draft PR body on every checkpoint. The repo is PUBLIC: no secrets, tokens, .env values,
     personal data or chat excerpts. Write what the next account needs, nothing else. -->
# Handoff: <topic, 3-6 words>

- Task: <Issue link, or "from the owner's chat">
- Branch / PR: `claude/<topic>` / #<number>
- Status: in progress | awaiting review | blocked | done
- Driver: <account or agent> since <YYYY-MM-DD HH:MM>   (on handover write: free)

## Task
<The owner's wording VERBATIM, in the original language. Do not paraphrase: wording is lost first.>

## Assumptions and questions for the owner
- <what you decided on your own while the owner was away, and what you are unsure about>

## Definition of done
- [ ] <observable result, e.g. "page /ru/x renders the new block in all 5 locales">
- [ ] `npm run typecheck` is clean; tests for the changed code pass

## Plan
- [ ] 1. <stage: small, ends in a working state, ~1 checkpoint>
- [ ] 2. <stage>

## What we learned about the code
<Key files and facts the next account would otherwise re-read: where the logic lives, gotchas. 5-10 lines. This saves the next account's free-plan tokens.>

## Done
<what is finished and works; reference commits or files>

## Remaining and next step
**Next step:** <one concrete action, with the file path to start from>
- <what else is left>

## Decisions and why
- <decision> — <reason; what was rejected>

## How to verify
<commands and manual checks; env vars needed (names only, never values)>

## Risks and overlaps
- Locales still missing for new UI strings (ru, uz, tg, kk, ky): <list or "none">
- New env vars / Mongoose model or index changes: <list or "none">
- Files other branches may also touch: <list or "none">

## Session log
- <YYYY-MM-DD HH:MM> <account/agent>: <took over / stage N done / handed over because of limit>
