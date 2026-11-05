'use strict';
// Minimal read-only git helpers. Any git error becomes null so callers degrade instead of crashing
// (e.g. in a shallow clone without origin/main).
const { execFileSync } = require('child_process');

function git(root, args) {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 128 * 1024 * 1024,
  });
}

function tryGit(root, args) {
  try {
    return git(root, args);
  } catch {
    return null;
  }
}

/** First existing ref among: preferred, origin/main, main. */
function resolveBase(root, preferred) {
  for (const ref of [preferred, 'origin/main', 'main']) {
    if (!ref) continue;
    if (tryGit(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) !== null) return ref;
  }
  return null;
}

function mergeBase(root, base) {
  const out = base ? tryGit(root, ['merge-base', base, 'HEAD']) : null;
  return out ? out.trim() : null;
}

const lines = (out) => (out ? out.split('\n').filter(Boolean) : []);

/** Files changed on the branch: commits after merge-base, uncommitted edits and new files (deleted ones included). */
function changedFiles(root, baseRev) {
  const set = new Set();
  if (baseRev) lines(tryGit(root, ['diff', '--name-only', baseRev, 'HEAD'])).forEach((f) => set.add(f));
  lines(tryGit(root, ['diff', '--name-only', 'HEAD'])).forEach((f) => set.add(f));
  lines(tryGit(root, ['ls-files', '--others', '--exclude-standard'])).forEach((f) => set.add(f));
  return [...set].sort();
}

function currentBranch(root) {
  const out = tryGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return out ? out.trim() : null;
}

module.exports = { git, tryGit, resolveBase, mergeBase, changedFiles, currentBranch };
