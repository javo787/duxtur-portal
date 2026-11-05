'use strict';
// Run external commands (git, gh) without a shell or prompts. Output is redacted: git/gh errors can contain tokens.
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { PATTERNS } = require('./secret-patterns');

/** Strips anything that looks like a secret or `user:password@` in a URL. */
function redact(text) {
  let out = String(text).replace(/(\w+:\/\/)[^/\s@]+@/g, '$1***@');
  for (const p of PATTERNS) out = out.replace(new RegExp(p.re.source, `g${p.re.flags.includes('i') ? 'i' : ''}`), '[secret hidden]');
  return out;
}

/** @returns {{status: number, out: string, err: string, missing: boolean}} status -1: failed to start or timed out */
function exec(cmd, args, { cwd, timeout = 60000 } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' },
  });
  return {
    status: r.error ? -1 : r.status === null ? -1 : r.status,
    out: redact(r.stdout || '').trim(),
    err: redact(r.stderr || '').trim(),
    missing: Boolean(r.error && r.error.code === 'ENOENT'),
  };
}

const git = (root, args, options) => exec('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, ...options });
const lines = (text) => (text ? text.split('\n').filter(Boolean) : []);
const sha = (text) => crypto.createHash('sha1').update(String(text).replace(/\r\n/g, '\n').trim()).digest('hex');
const tail = (text, n = 6) => lines(text).slice(-n).join('\n');

module.exports = { redact, exec, git, lines, sha, tail };
