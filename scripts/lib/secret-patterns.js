'use strict';
// High-precision secret patterns (few false positives). Used by check-secrets.js and agent-checkpoint.js
// (before an auto-commit: the repo is PUBLIC, so a secret in a WIP commit is public right after push).
// The matched value is never printed, only pattern name, file and line.
// Mark an intentional fake (test stub) with the comment `secret-scan:allow` on the same line.

// Placeholder passwords in examples: <password>, ***, xxx, changeme, ${VAR}, ...
const PLACEHOLDER = /^(?:<[^>]*>|\*+|x{3,}|password|passwd|pass|your[_-]?\w*|changeme|secret|\$\{[^}]*\}|\{\{[^}]*\}\}|%[A-Za-z_]+%)$/i;

const PATTERNS = [
  { id: 'github-token', name: 'GitHub token', re: /\b(?:github_pat_[A-Za-z0-9_]{36,}|gh[pousr]_[A-Za-z0-9]{36,})\b/ },
  {
    id: 'private-key',
    name: 'Private key (PEM)',
    // Header + base64 body (real newline or an escaped "\n" from an env var). A lone header (e.g. in an error text) is not a secret.
    re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----(?:\s|\\r|\\n)*[A-Za-z0-9+/=]{40,}/,
    multiline: true,
  },
  { id: 'aws-key', name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'telegram-bot-token', name: 'Telegram bot token', re: /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/ },
  { id: 'groq-key', name: 'Groq key', re: /\bgsk_[A-Za-z0-9]{40,}\b/ },
  { id: 'sk-key', name: 'API key sk-... (Anthropic/OpenAI)', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: 'slack-token', name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'google-api-key', name: 'Google API key (AIza..., incl. Gemini)', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'resend-key', name: 'Resend key', re: /\bre_[A-Za-z0-9]{24,}\b/ },
  {
    id: 'mongo-uri',
    name: 'MongoDB URI with password',
    re: /mongodb(?:\+srv)?:\/\/([^\s:@/]+):([^\s@/]+)@/,
    skip: (m) => PLACEHOLDER.test(m[2]),
  },
];

/**
 * @param {string} text    file content or a snippet
 * @param {string} relPath path relative to the repo root (for per-pattern allow-lists)
 * @returns {{id: string, name: string, line: number}[]}
 */
function scanText(text, relPath = '') {
  const findings = [];
  const norm = String(relPath).replace(/\\/g, '/');
  const rows = text.split('\n');
  for (const p of PATTERNS) {
    if (p.allowFiles && p.allowFiles.some((f) => norm === f || norm.endsWith(`/${f}`))) continue;
    if (p.multiline) {
      // May span lines (PEM): search the whole text, derive the line from the offset.
      const m = new RegExp(p.re.source).exec(text);
      if (m) {
        const line = text.slice(0, m.index).split('\n').length;
        if (!rows[line - 1].includes('secret-scan:allow')) findings.push({ id: p.id, name: p.name, line });
      }
      continue;
    }
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      if (row.includes('secret-scan:allow')) continue;
      const m = p.re.exec(row);
      if (!m) continue;
      if (p.skip && p.skip(m)) continue;
      findings.push({ id: p.id, name: p.name, line: idx + 1 });
    }
  }
  return findings;
}

module.exports = { PATTERNS, scanText };
