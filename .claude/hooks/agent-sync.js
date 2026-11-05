#!/usr/bin/env node
'use strict';
/**
 * Claude Code hooks for the account relay (wired in .claude/settings.json):
 *   node .claude/hooks/agent-sync.js start   SessionStart: short briefing into the agent context
 *   node .claude/hooks/agent-sync.js edit    PostToolUse (Edit|Write|MultiEdit): autosave, at most once per 10 min
 *   node .claude/hooks/agent-sync.js stop    Stop: autosave after every reply
 * Autosave = scripts/agent-checkpoint.js --auto (WIP commit + push + draft PR). On in cloud sessions
 * (CLAUDE_CODE_REMOTE=true) and with DUXTUR_AUTOSAVE=1; DUXTUR_AUTOSAVE=0 turns it off.
 * Fail-open: any internal error exits 0. Only a secret finding (checkpoint exit 2) is fed back to the agent, once per session.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const EVERY_MS = 10 * 60 * 1000;
const sha = (t) => crypto.createHash('sha1').update(String(t)).digest('hex').slice(0, 16);
const write = (fd, text) => fs.writeSync(fd, text.endsWith('\n') ? text : `${text}\n`);

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const enabled = (env = process.env) => (env.DUXTUR_AUTOSAVE === '0' ? false : env.DUXTUR_AUTOSAVE === '1' ? true : env.CLAUDE_CODE_REMOTE === 'true');
const tmp = (name, root) => path.join(os.tmpdir(), `duxtur-${name}-${sha(path.resolve(root))}.json`);

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

/** @returns {{ran: boolean, status?: number, out?: string}} */
function autosave(root, { everyMs = 0 } = {}) {
  if (!enabled()) return { ran: false };
  const file = tmp('autosave', root);
  if (everyMs && Date.now() - (loadJson(file).at || 0) < everyMs) return { ran: false };
  try {
    fs.writeFileSync(file, JSON.stringify({ at: Date.now() }));
  } catch {
    // no throttle state: fine
  }
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'agent-checkpoint.js'), '--auto', '--root', root], { cwd: root, encoding: 'utf8', timeout: 120000 });
  return { ran: true, status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

/** True the first time for (session, key): the agent hears about a problem once, not after every reply. */
function firstTime(sessionId, key, root) {
  const file = tmp('notified', root);
  const state = loadJson(file);
  const id = `${sessionId || 'nosession'}:${key}`;
  if (state.id === id) return false;
  try {
    fs.writeFileSync(file, JSON.stringify({ id }));
  } catch {
    // ignore
  }
  return true;
}

function start(root) {
  const { tryGit, resolveBase, currentBranch } = require(path.join(root, 'scripts', 'lib', 'git.js'));
  const out = [];
  const branch = currentBranch(root);
  const base = resolveBase(root);
  const cloud = process.env.CLAUDE_CODE_REMOTE === 'true';

  if (!branch) return;
  if (branch === 'main' || branch === 'master') {
    out.push(`On ${branch}: never commit or push here. For a task create a branch from origin/main: git switch -c claude/<topic> (skill take-task).`);
  } else if (base) {
    const counts = (tryGit(root, ['rev-list', '--left-right', '--count', `${base}...HEAD`]) || '').trim().split(/\s+/);
    const [behind, ahead] = [Number(counts[0]) || 0, Number(counts[1]) || 0];
    out.push(`Branch ${branch}: ${ahead} commit(s) ahead of ${base}${behind ? `, ${behind} behind (merge ${base} before finishing)` : ''}.`);
  }

  // Interrupted work of other accounts: remote branches not merged into main whose last commit is a WIP checkpoint.
  if (base) {
    const refs = (tryGit(root, ['for-each-ref', '--sort=-committerdate', '--count=40', '--format=%(refname:short)|%(committerdate:relative)|%(subject)', 'refs/remotes/origin']) || '')
      .split('\n').filter(Boolean).map((l) => l.split('|'));
    const wip = refs
      .filter(([name]) => name !== 'origin/HEAD' && name !== 'origin/main' && name !== 'origin/master' && name !== `origin/${branch}`)
      .filter(([name]) => (tryGit(root, ['rev-list', '--count', `${base}..${name}`]) || '0').trim() !== '0')
      .filter(([, , subject]) => /^wip\b/i.test(subject || ''))
      .slice(0, 5);
    if (wip.length) {
      out.push('Unfinished work by other sessions (last commit is a WIP checkpoint):');
      wip.forEach(([name, when]) => out.push(`  ${name.replace(/^origin\//, '')} · ${when}`));
      out.push('To resume one: skill continue-task. Full list: npm run queue.');
    }
  }

  out.push(
    'Relay rules (AGENTS.md): new task = skill take-task; resuming = continue-task; done = finish-work. Commit WIP to a claude/<topic> branch, never to main. The repo is PUBLIC: no secrets in files, PRs or handoffs.',
  );
  if (cloud) out.push('Cloud session: autosave pushes your work every ~10 min and after each reply. Run `npm run checkpoint -- "note"` before any long operation.');
  write(1, `[agent-sync]\n${out.join('\n')}`);
}

function main() {
  const mode = process.argv[2];
  const input = readInput();
  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  if (mode === 'start') return start(root);
  if (mode !== 'edit' && mode !== 'stop') return;

  const saved = autosave(root, mode === 'edit' ? { everyMs: EVERY_MS } : {});
  if (saved.ran && saved.status === 2 && !input.stop_hook_active && firstTime(input.session_id, 'secret', root)) {
    write(2, `Autosave refused: a secret was found in the uncommitted changes. Nothing was committed or pushed.\n${saved.out}\nRemove it from the files, move it to env vars, then run npm run checkpoint.`);
    process.exit(2);
  }
}

try {
  main();
} catch {
  // fail-open: a hook must never break the session
}
process.exit(0);
