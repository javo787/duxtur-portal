#!/usr/bin/env node
'use strict';
/**
 * Work queue: open draft PRs and PRs titled [WIP]: who drives them, how long the branch has been quiet, where to resume.
 * For an account picking up work after another account hit its usage limit.
 *
 *   node scripts/agent-queue.js [--stale <minutes>] [--root <dir>]      (npm run queue)
 *
 * FREE = no commits on the branch for 30+ minutes (autosave pushes every ~10 minutes, so longer silence most likely means
 * a cut-off session). A hint, not a lock: before starting, comment "Taking over: ..." on the PR (skill continue-task).
 * Needs an authenticated gh; without it prints the draft PR list URL.
 */
const { parseArgs, rootDir } = require('./lib/cli');
const { exec, git } = require('./lib/proc');
const { repoSlug } = require('./lib/github');

const DEFAULT_STALE_MINUTES = 30;

const pick = (text, re) => {
  const m = re.exec(text || '');
  return m ? m[1].trim() : null;
};

/** First unchecked item of the "## Plan" section, or null. */
function firstOpenStep(body) {
  const section = /^##\s+Plan[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(body || '');
  const m = /^\s*[-*]\s+\[ \]\s+(.+)$/m.exec(section ? section[1] : '');
  return m ? m[1].trim() : null;
}

function formatAge(minutes) {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} min ago`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} d ago`;
}

/** commitTime: Unix seconds of the branch's last commit (more precise than updatedAt, which comments also move). */
function classify(pr, { now = Date.now(), staleMinutes = DEFAULT_STALE_MINUTES, commitTime = null } = {}) {
  const body = pr.body || '';
  const queued = pr.isDraft || /^\s*\[?WIP\]?/i.test(pr.title || '');
  const lastMs = commitTime ? commitTime * 1000 : Date.parse(pr.updatedAt) || now;
  const ageMin = Math.max(0, (now - lastMs) / 60000);
  const status = /^\s*-?\s*Status:\s*(?:awaiting review|done)/im.test(body) ? 'review' : ageMin < staleMinutes ? 'busy' : 'free';
  return {
    queued,
    ageMin,
    status,
    leader: pick(body, /Driver:\s*([^\n]+)/i),
    next: pick(body, /\*\*Next step:\*\*\s*([^\n]+)/i) || firstOpenStep(body),
  };
}

function render(prs, options, commitTimes = new Map()) {
  const rows = prs.map((pr) => ({ pr, ...classify(pr, { ...options, commitTime: commitTimes.get(pr.number) || null }) })).filter((r) => r.queued);
  const rank = { free: 0, busy: 1, review: 2 };
  rows.sort((a, b) => rank[a.status] - rank[b.status] || b.ageMin - a.ageMin);
  if (!rows.length) return 'Queue is empty: no open draft PRs. Start a new task with the take-task skill.';

  const label = { free: 'FREE', busy: 'IN PROGRESS', review: 'AWAITING REVIEW' };
  const out = [`Work queue (draft PRs and [WIP]); free = no commits on the branch for ${options.staleMinutes}+ minutes:`];
  for (const r of rows) {
    out.push(`  #${r.pr.number} ${r.pr.title} · ${r.pr.headRefName} · ${formatAge(r.ageMin)} · ${label[r.status]}${r.leader ? ` · driver: ${r.leader}` : ''}`);
    if (r.next) out.push(`      next: ${r.next}`);
  }
  out.push('', 'To take one: skill continue-task; first comment: gh pr comment <number> --body "Taking over: <who>".');
  return out.join('\n');
}

function main(argv) {
  const { options } = parseArgs(argv, { options: ['root', 'stale'] });
  const root = rootDir(options);
  const staleMinutes = options.stale ? Number(options.stale) : DEFAULT_STALE_MINUTES;
  if (!Number.isFinite(staleMinutes) || staleMinutes <= 0) throw new Error('--stale: a positive number of minutes is required');

  const slug = repoSlug(root);
  const manual = slug ? `https://github.com/${slug.owner}/${slug.repo}/pulls?q=is%3Apr+is%3Aopen+draft%3Atrue` : null;
  const listed = exec('gh', ['pr', 'list', '--state', 'open', '--limit', '50', '--json', 'number,title,headRefName,isDraft,updatedAt,body,url'], { cwd: root, timeout: 45000 });
  if (listed.missing || listed.status !== 0) {
    const why = listed.missing ? 'gh is not installed' : `gh could not list PRs (${listed.err.split('\n').pop() || `code ${listed.status}`})`;
    console.log(`${why}.${manual ? ` Open the draft PR list in a browser: ${manual}` : ''}`);
    console.log('Unfinished branches are also visible via: git fetch --all --prune && git branch -r --sort=-committerdate');
    return 0;
  }

  let prs;
  try {
    prs = JSON.parse(listed.out || '[]');
  } catch {
    throw new Error('gh returned non-JSON');
  }
  const commitTimes = new Map();
  for (const pr of prs) {
    const t = Number(git(root, ['log', '-1', '--format=%ct', `refs/remotes/origin/${pr.headRefName}`]).out);
    if (Number.isFinite(t) && t > 0) commitTimes.set(pr.number, t);
  }
  console.log(render(prs, { now: Date.now(), staleMinutes }, commitTimes));
  return 0;
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    console.error(`agent-queue: ${e.message}`);
    process.exit(2);
  }
}

module.exports = { classify, firstOpenStep, formatAge, render };
