'use strict';
// Tiny dependency-free arg parser: parseArgs(argv, { flags: [...], options: [...] }) -> { flags: Set, options, positional }.
// An unknown --param throws: a typo must not silently change behaviour.
const path = require('path');

function parseArgs(argv, spec = {}) {
  const flags = new Set();
  const options = {};
  const positional = [];
  const knownFlags = new Set(spec.flags || []);
  const knownOptions = new Set(spec.options || []);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-' || !arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (knownFlags.has(name)) flags.add(name);
    else if (knownOptions.has(name)) {
      if (i + 1 >= argv.length) throw new Error(`--${name} needs a value`);
      options[name] = argv[++i];
    } else throw new Error(`Unknown parameter: ${arg}`);
  }
  return { flags, options, positional };
}

/** Repo root: --root or two levels above scripts/lib. */
function rootDir(options) {
  return path.resolve(options.root || path.join(__dirname, '..', '..'));
}

module.exports = { parseArgs, rootDir };
