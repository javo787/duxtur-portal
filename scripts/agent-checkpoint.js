#!/usr/bin/env node
'use strict';
/**
 * One-command checkpoint: commit everything, push the current branch, open/update a draft PR.
 * A usage limit can kill the session at any moment and unpushed work dies with the container.
 *
 *   node scripts/agent-checkpoint.js ["note: what is left"] [--no-pr] [--no-push] [--force-body] [--auto] [--root <dir>]
 *   npm run checkpoint -- "stage 2: booking form"
 *
 *  1. Refuses on main/master, detached HEAD, and mid merge/rebase/cherry-pick.
 *  2. Scans uncommitted changes for secrets (check-secrets.js --worktree); on a hit commits nothing (exit 2). The repo is PUBLIC.
 *  3. Commits everything (git add -A, .gitignore respected) as `wip: <note>`.
 *  4. Pushes (git push -u origin HEAD). Never force.
 *  5. Draft PR via gh (without gh: prints a compare URL). If the branch has a handoff file
 *     (.agent-sync/handoff/*-<branch>.md), its text becomes the PR body and is refreshed on every checkpoint;
 *     a body edited by hand is not overwritten (--force-body overrides).
 *
 * --auto: for hooks: silent, never throws, exit 2 only when a secret is found.
 * Exit: 0 done or nothing to do, 1 refused/failed, 2 secret found.
 * Chat transcripts never go into the PR body (they can contain tokens).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseArgs, rootDir } = require('./lib/cli');
const { redact, exec, git, lines, sha, tail } = require('./lib/proc');
const { repoSlug } = require('./lib/github');

const HANDOFF_DIR = '.agent-sync/handoff';
const MAX_FILES = 500;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Personal agent permissions: never checkpointed.
const NOT_CHECKPOINTED = ['.claude/settings.local.json'];
const BUSY_MARKERS = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'BISECT_LOG'];
const OWNED = /^<!--\s*agent-handoff:file=([^\s>]+)\s*-->/;
const AUTO_MARKER = '<!-- agent-handoff:auto -->';
const STUB = '_Not recorded._';

function gitDir(root) {
  const out = git(root, ['rev-parse', '--git-dir']).out;
  return out ? path.resolve(root, out) : null;
}

/** Why committing is unsafe right now (merge/rebase in progress, conflicts), or null. */
function busyReason(root) {
  const dir = gitDir(root);
  if (dir) {
    const marker = BUSY_MARKERS.find((m) => fs.existsSync(path.join(dir, m)));
    if (marker) return `a git operation is in progress (${marker})`;
  }
  if (lines(git(root, ['diff', '--name-only', '--diff-filter=U']).out).length) return 'unresolved merge conflicts';
  return null;
}

// State between runs lives in the temp dir (never in the repo).
const stateFile = (root) => path.join(os.tmpdir(), `duxtur-checkpoint-${sha(path.resolve(root)).slice(0, 16)}.json`);
function loadState(root) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(root), 'utf8'));
  } catch {
    return {};
  }
}
function saveState(root, state) {
  try {
    fs.writeFileSync(stateFile(root), JSON.stringify(state));
  } catch {
    // without state we just call gh a bit more often
  }
}

// ── Branch handoff file ──────────────────────────────────────────────────────────────────────────
const slugOf = (branch) => branch.replace(/[^A-Za-z0-9._-]+/g, '-');

/** Repo-relative path of this branch's handoff file (latest by name) or null. */
function findHandoff(root, branch) {
  const dir = path.join(root, HANDOFF_DIR);
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return null;
  }
  const suffix = `-${slugOf(branch)}.md`;
  const hit = names.filter((n) => n !== 'TEMPLATE.md' && n.endsWith(suffix)).sort().pop();
  return hit ? `${HANDOFF_DIR}/${hit}` : null;
}

/** PR title and body from the handoff text (first "# ..." line becomes the title). */
function renderHandoff(rel, text) {
  const rows = String(text).replace(/\r\n/g, '\n').replace(/^\s*<!--[\s\S]*?-->\s*/, '').split('\n');
  let topic = '';
  if (/^#\s+/.test(rows[0] || '')) topic = rows.shift().replace(/^#\s+/, '').replace(/^Handoff:\s*/i, '').trim();
  const body = `<!-- agent-handoff:file=${rel} -->\n${rows.join('\n').replace(/^\n+/, '')}`.trimEnd();
  return { title: topic, body: `${body}\n` };
}

function autoBody(root, base, branch) {
  const range = base ? `${base}..HEAD` : 'HEAD';
  const log = lines(git(root, ['log', '--format=- %s', '-n', '15', range]).out).join('\n') || '- (no commits)';
  const stat = lines(git(root, ['diff', '--shortstat', base ? `${base}...HEAD` : 'HEAD~1']).out)[0] || '';
  return [
    AUTO_MARKER,
    '> ⏸ **Autosave.** Work was saved as is and may not build. The agent session may have been cut off (usage limit).',
    '',
    '## Task',
    `${STUB} Paste the owner's wording verbatim (Issue or chat) when you take this over.`,
    '',
    '## Plan',
    STUB,
    '',
    '## Done',
    log,
    stat ? `\n${stat.trim()}` : '',
    '',
    '## Remaining and next step',
    `Read \`git diff origin/main...${branch}\`, then write the task, plan and what is left here. Continue on this branch, no force-push. Comment "Taking over" so nobody takes the same work.`,
    '',
  ].join('\n');
}

// ── Pull request ─────────────────────────────────────────────────────────────────────────────────
function defaultBase(root) {
  const head = git(root, ['symbolic-ref', '--short', '-q', 'refs/remotes/origin/HEAD']).out.replace(/^origin\//, '');
  if (head) return head;
  return git(root, ['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main']).status === 0 ? 'main' : 'master';
}

function compareUrl(root, base, branch) {
  const slug = repoSlug(root);
  return slug ? `https://github.com/${slug.owner}/${slug.repo}/compare/${base}...${encodeURIComponent(branch)}?expand=1` : null;
}

/** The PR body may be replaced unless someone edited it by hand after our last write. */
function bodyIsSafeToReplace({ current, next, previous, lastWrittenHash, force }) {
  if (force) return true;
  const now = String(current || '').replace(/\r\n/g, '\n').trim();
  if (!now) return true;
  if (now === next.trim()) return true;
  if (previous && now === previous.trim()) return true;
  return Boolean(lastWrittenHash) && sha(now) === lastWrittenHash;
}

function syncPullRequest(root, ctx, report) {
  const { branch, base, handoff, previousHandoffText, force, auto } = ctx;
  const manual = ctx.manualUrl ? `: ${ctx.manualUrl}` : '';
  const state = loadState(root);
  if (auto && state.ghOffUntil && Date.now() < state.ghOffUntil) {
    report.push(`gh unavailable (check postponed): open the draft PR manually${manual}`);
    return null;
  }

  const listed = exec('gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number,url,isDraft,body', '--limit', '1'], { cwd: root, timeout: 45000 });
  if (listed.missing || listed.status !== 0) {
    if (auto) {
      state.ghOffUntil = Date.now() + 60 * 60 * 1000; // a hook must not retry a failing gh after every reply
      saveState(root, state);
    }
    const why = listed.missing ? 'gh is not installed' : `gh could not list PRs (${tail(listed.err, 1) || `code ${listed.status}`})`;
    report.push(`${why}: open the draft PR manually${manual}`);
    return null;
  }
  let existing = null;
  try {
    existing = JSON.parse(listed.out || '[]')[0] || null;
  } catch {
    existing = null;
  }

  let rendered = null;
  if (handoff) {
    try {
      rendered = renderHandoff(handoff, fs.readFileSync(path.join(root, handoff), 'utf8'));
    } catch {
      rendered = null;
    }
  }

  const bodyFile = path.join(os.tmpdir(), `duxtur-pr-body-${process.pid}-${Date.now()}.md`);
  try {
    if (existing) {
      if (!rendered) {
        report.push(`PR: ${existing.url}`);
        return existing.url;
      }
      const current = String(existing.body || '');
      const isAuto = current.startsWith(AUTO_MARKER);
      const owned = OWNED.test(current) || isAuto || !current.trim();
      const previous = previousHandoffText ? renderHandoff(handoff, previousHandoffText).body : null;
      // A stub body is replaced freely: nobody filled it in by hand.
      const safe =
        (isAuto && current.includes(STUB)) ||
        bodyIsSafeToReplace({ current, next: rendered.body, previous, lastWrittenHash: (state.bodies || {})[branch], force });
      if (!owned && !force) {
        report.push(`PR: ${existing.url} (body written by hand: left alone; use --force-body to replace it with ${handoff})`);
      } else if (!safe) {
        report.push(`PR: ${existing.url} (body edited by hand since the last write: not overwritten; update ${handoff} or rerun with --force-body)`);
      } else if (sha(existing.body || '') === sha(rendered.body)) {
        report.push(`PR: ${existing.url}`);
      } else {
        fs.writeFileSync(bodyFile, rendered.body);
        const edited = exec('gh', ['pr', 'edit', String(existing.number), '--body-file', bodyFile], { cwd: root, timeout: 45000 });
        if (edited.status === 0) {
          state.bodies = { ...(state.bodies || {}), [branch]: sha(rendered.body) };
          saveState(root, state);
          report.push(`PR: ${existing.url} (body refreshed from ${handoff})`);
        } else {
          report.push(`PR: ${existing.url} (body not updated: ${tail(edited.err, 1) || `code ${edited.status}`})`);
        }
      }
      return existing.url;
    }

    const title = `[WIP] ${(rendered && rendered.title) || branch}`.slice(0, 120);
    const body = rendered ? rendered.body : autoBody(root, base, branch);
    fs.writeFileSync(bodyFile, body);
    const created = exec('gh', ['pr', 'create', '--draft', '--base', base, '--head', branch, '--title', title, '--body-file', bodyFile], { cwd: root, timeout: 60000 });
    if (created.status !== 0) {
      report.push(`draft PR not created (${tail(created.err, 1) || `code ${created.status}`}): open it manually${manual}`);
      return null;
    }
    const url = lines(created.out).pop() || '';
    state.bodies = { ...(state.bodies || {}), [branch]: sha(body) };
    saveState(root, state);
    report.push(`draft PR created: ${url}`);
    return url;
  } finally {
    fs.rmSync(bodyFile, { force: true });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────
/** @returns {{code: number, report: string[], url: string|null}} */
function checkpoint(root, { message = '', push = true, pr = true, force = false, auto = false } = {}) {
  const report = [];
  const refuse = (text) => ({ code: 1, report: [...report, text], url: null });

  const branch = git(root, ['symbolic-ref', '--short', '-q', 'HEAD']).out;
  if (!branch) return refuse('detached HEAD: switch to a branch (git switch -c claude/<topic>)');
  if (branch === 'main' || branch === 'master') {
    return refuse(`you are on ${branch}: no checkpoints on main. Create a branch: git switch -c claude/<topic> (your changes carry over)`);
  }
  const busy = busyReason(root);
  if (busy) return refuse(`${busy}: finish or abort it, then retry`);

  const base = git(root, ['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main']).status === 0 ? 'origin/main' : null;
  const handoff = findHandoff(root, branch);
  const previousHandoffText = handoff ? git(root, ['show', `HEAD:${handoff}`]).out || null : null;

  // 1. Commit
  const dirty = lines(git(root, ['status', '--porcelain']).out);
  if (dirty.length) {
    const scan = exec(process.execPath, [path.join(__dirname, 'check-secrets.js'), '--worktree', '--root', root], { cwd: root, timeout: 60000 });
    if (scan.status === 1) {
      return { code: 2, report: ['secret found in the changes, no checkpoint made (values not shown):', ...lines(scan.out).filter((l) => /^\s+- /.test(l))], url: null };
    }

    git(root, ['add', '-A', '--', '.', ...NOT_CHECKPOINTED.map((f) => `:(exclude)${f}`)]);
    const staged = lines(git(root, ['diff', '--cached', '--name-only']).out);
    if (staged.length > MAX_FILES) {
      git(root, ['reset', '-q']);
      return refuse(`too many files in one checkpoint (${staged.length}): check .gitignore and commit by topic manually`);
    }
    const huge = staged.find((f) => {
      try {
        return fs.statSync(path.join(root, f)).size > MAX_FILE_BYTES;
      } catch {
        return false;
      }
    });
    if (huge) {
      git(root, ['reset', '-q']);
      return refuse(`file larger than 5 MB: ${huge}. Add it to .gitignore or delete it, then retry`);
    }

    if (staged.length) {
      const first = String(message).trim().split('\n')[0];
      const subject = first ? `wip: ${first}`.slice(0, 100) : `wip: checkpoint (${staged.length} files)`;
      const identity = git(root, ['config', 'user.email']).out ? [] : ['-c', 'user.name=Agent', '-c', 'user.email=agent@users.noreply.github.com'];
      const committed = git(root, [...identity, 'commit', '-q', '-m', subject]);
      if (committed.status !== 0) return refuse(`commit failed: ${tail(committed.err || committed.out, 3)}`);
      report.push(`commit: ${subject} (${staged.length} files)`);
    }
  }

  // 2. Is a push needed
  const remoteRef = `refs/remotes/origin/${branch}`;
  const hasRemote = git(root, ['rev-parse', '--verify', '--quiet', remoteRef]).status === 0;
  const ahead = hasRemote
    ? Number(git(root, ['rev-list', '--count', `${remoteRef}..HEAD`]).out || 0)
    : Number(git(root, ['rev-list', '--count', base ? `${base}..HEAD` : 'HEAD']).out || 0);
  if (!report.length && ahead === 0) report.push('nothing to save: no changes, everything is pushed');

  let pushed = false;
  if (push && ahead > 0) {
    const sent = git(root, ['push', '-u', 'origin', 'HEAD'], { timeout: 90000 });
    if (sent.status !== 0) {
      const text = `${sent.err}\n${sent.out}`;
      const hint = /non-fast-forward|rejected|fetch first/i.test(text)
        ? `the remote branch moved ahead: git pull --rebase origin ${branch} and retry (no force-push)`
        : /could not read|authentication|permission|403|401|denied/i.test(text)
          ? 'no push permission (check the account access to the repository)'
          : tail(text, 3);
      return { code: 1, report: [...report, `push failed: ${hint}`], url: null };
    }
    pushed = true;
    report.push(`pushed to origin/${branch}`);
  }

  // 3. Draft PR
  let url = null;
  if (pr && push && (pushed || (hasRemote && !auto))) {
    const manualUrl = compareUrl(root, defaultBase(root), branch);
    url = syncPullRequest(root, { branch, base: defaultBase(root), handoff, previousHandoffText, force, manualUrl, auto }, report);
    if (!handoff && url) report.push(`hint: the PR body is a stub. Create ${HANDOFF_DIR}/YYYY-MM-DD-${slugOf(branch)}.md from TEMPLATE.md (task, plan, what is left)`);
  }
  return { code: 0, report, url };
}

function main(argv) {
  const { flags, options, positional } = parseArgs(argv, { flags: ['no-pr', 'no-push', 'auto', 'force-body'], options: ['root'] });
  const root = rootDir(options);
  const auto = flags.has('auto');
  const result = checkpoint(root, {
    message: positional.join(' '),
    push: !flags.has('no-push'),
    pr: !flags.has('no-pr'),
    force: flags.has('force-body'),
    auto,
  });
  const out = result.report.map((l) => (result.code === 0 ? `✔ ${l}` : `✖ ${l}`)).join('\n');
  if (out && result.code !== 0) console.error(out);
  else if (out && !auto) console.log(out);
  return result.code;
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    console.error(`agent-checkpoint: ${redact(e.message)}`);
    process.exit(process.argv.includes('--auto') ? 0 : 1);
  }
}

module.exports = { checkpoint, redact, renderHandoff, findHandoff, bodyIsSafeToReplace, slugOf, compareUrl };
