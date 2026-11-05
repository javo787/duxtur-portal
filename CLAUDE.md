@AGENTS.md

## Claude Code specifics

- Hooks (`.claude/settings.json` + `.claude/hooks/agent-sync.js`): SessionStart prints a short briefing; in cloud sessions autosave runs `scripts/agent-checkpoint.js --auto` after file edits (at most every 10 min) and after each reply. Locally it is off; enable with `DUXTUR_AUTOSAVE=1`, disable with `DUXTUR_AUTOSAVE=0`.
- Skills: `take-task`, `continue-task`, `finish-work`, `karpathy-discipline` (`.claude/skills/`).
- Personal permissions go to `.claude/settings.local.json` (gitignored, never committed).
