'use strict';
const { git } = require('./proc');

/** { owner, repo } from the origin URL (https or ssh); credentials are dropped; null if not GitHub. */
function repoSlug(root) {
  const url = git(root, ['remote', 'get-url', 'origin']).out.replace(/\/\/[^/@]*@/, '//');
  const m = /github\.com[:/]+([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(url);
  return m ? { owner: m[1], repo: m[2] } : null;
}

module.exports = { repoSlug };
