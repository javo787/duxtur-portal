#!/usr/bin/env node
'use strict';
/**
 * Secret scan of tracked files (tokens, private keys, URIs with passwords). Values are NEVER printed: file, line, pattern name only.
 *
 * node scripts/check-secrets.js [--changed | --worktree] [--base <ref>] [--root <dir>]
 *   --changed   files changed on the branch (commits after merge-base, edits, new files)
 *   --worktree  uncommitted only (edits and new files): what the next commit would contain
 * Exit: 0 clean, 1 found, 2 failure.
 */
const fs = require('fs');
const path = require('path');
const { parseArgs, rootDir } = require('./lib/cli');
const { tryGit, resolveBase, mergeBase, changedFiles } = require('./lib/git');
const { scanText } = require('./lib/secret-patterns');

const SKIP_NAMES = new Set(['package-lock.json']);
const SKIP_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|icns|ttf|otf|woff2?|mp3|mp4|mov|wav|zip|gz|tgz|pdf|so|a|bin)$/i;
const MAX_BYTES = 2 * 1024 * 1024;

function listFiles(root, flags, options) {
  if (flags.has('worktree')) return changedFiles(root, null);
  if (flags.has('changed')) {
    const base = resolveBase(root, options.base);
    return changedFiles(root, base ? mergeBase(root, base) : null);
  }
  const out = tryGit(root, ['ls-files', '-z']);
  return out ? out.split('\0').filter(Boolean) : [];
}

function main(argv) {
  const { flags, options } = parseArgs(argv, { flags: ['changed', 'worktree'], options: ['base', 'root'] });
  const root = rootDir(options);
  const files = listFiles(root, flags, options);
  if (!files.length && !flags.has('changed') && !flags.has('worktree')) {
    console.error('Could not list files (is this a git repository?).');
    return 2;
  }

  const findings = [];
  let scanned = 0;
  for (const rel of files) {
    if (SKIP_NAMES.has(path.basename(rel)) || SKIP_EXT.test(rel)) continue;
    const abs = path.join(root, rel);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue; // deleted
    }
    if (!stat.isFile() || stat.size > MAX_BYTES) continue;
    const buffer = fs.readFileSync(abs);
    if (buffer.subarray(0, 8000).includes(0)) continue; // binary
    scanned++;
    for (const f of scanText(buffer.toString('utf8'), rel)) findings.push({ ...f, file: rel });
  }

  console.log(`Secrets: scanned ${scanned} files${flags.has('worktree') ? ' (uncommitted)' : flags.has('changed') ? ' (changed on branch)' : ''}`);
  if (findings.length) {
    console.log(`\n✖ Possible secrets found: ${findings.length} (values not shown)`);
    findings.forEach((f) => console.log(`  - ${f.file}:${f.line}  ${f.name}`));
    console.log('\nRemove the secret from the file, rotate it (it may already be in git history) and keep it in env vars (Vercel env vars, local .env.local).');
    return 1;
  }
  console.log('\n✔ No secrets found.');
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (e) {
  console.error(`check-secrets: ${e.message}`);
  process.exit(2);
}
