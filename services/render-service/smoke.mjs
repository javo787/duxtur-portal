// Starts the BUILT bundle and talks to it over HTTP: proves that dist/server.js boots with only the packages from
// package.json, that the secrets are checked, and that CORS is limited. No database, Telegram or Chromium needed.
import { spawn } from 'node:child_process';

const PORT = 38123;
const base = `http://127.0.0.1:${PORT}`;
const child = spawn(process.execPath, ['dist/server.js'], {
  env: {
    PATH: process.env.PATH,
    PORT: String(PORT),
    EDU_TELEGRAM_BOT_SECRET: 'smoke-edu-secret',
    TELEGRAM_BOT_SECRET: 'smoke-admin-secret',
    ALLOWED_ORIGINS: 'https://www.duxtur.org',
    // src/lib/mongodb.ts refuses to load without this (a deliberate fail-fast). Nothing listens there: the short timeouts
    // make the one check that reaches the database fail in half a second instead of waiting 30 s.
    MONGODB_URI: 'mongodb://127.0.0.1:1/smoke?serverSelectionTimeoutMS=500&connectTimeoutMS=500',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (d) => (logs += d));
child.stderr.on('data', (d) => (logs += d));

let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${extra}`}`);
  if (!ok) failures += 1;
};
const post = (path, headers, body) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const health = await fetch(`${base}/healthz`);
  check('GET /healthz is 200 and {ok:true}', health.status === 200 && (await health.json()).ok === true);

  // CORS lives on the card endpoints; OPTIONS answers without doing any work (no Chromium needed).
  const allowed = await fetch(`${base}/card/any`, { method: 'OPTIONS', headers: { origin: 'https://www.duxtur.org' } });
  check('CORS: allowed origin gets the header', allowed.status === 204 && allowed.headers.get('access-control-allow-origin') === 'https://www.duxtur.org');
  const bare = await fetch(`${base}/card/any`, { method: 'OPTIONS', headers: { origin: 'https://duxtur.org' } });
  check('CORS: an origin not in ALLOWED_ORIGINS gets nothing', bare.headers.get('access-control-allow-origin') === null);
  const foreign = await fetch(`${base}/card/any`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
  check('CORS: a foreign origin gets nothing', foreign.headers.get('access-control-allow-origin') === null);

  check('edu webhook without secret -> 401', (await post('/telegram/edu', {}, { update_id: 1 })).status === 401);
  check('edu webhook with wrong secret -> 401', (await post('/telegram/edu', { 'x-telegram-bot-api-secret-token': 'nope' }, { update_id: 1 })).status === 401);
  check('edu webhook with the right secret -> 200', (await post('/telegram/edu', { 'x-telegram-bot-api-secret-token': 'smoke-edu-secret' }, { update_id: 1 })).status === 200);
  check('admin webhook without secret -> 401', (await post('/telegram/admin', {}, {})).status === 401);
  check('admin webhook ignores ?secret= in the URL -> 401', (await post('/telegram/admin?secret=smoke-admin-secret', {}, {})).status === 401);
  check('admin webhook with the header secret -> 200 (database error is swallowed)', (await post('/telegram/admin', { 'x-telegram-bot-api-secret-token': 'smoke-admin-secret' }, {})).status === 200);

  const badJson = await fetch(`${base}/telegram/edu`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'smoke-edu-secret' }, body: '{oops' });
  check('malformed JSON -> 400 JSON, not an HTML page', badJson.status === 400 && (await badJson.json()).error === 'Bad request');

  check('unknown path -> 404 JSON', (await fetch(`${base}/nope`)).status === 404);
  check('/card/<too long id> -> 400', (await fetch(`${base}/card/${'x'.repeat(130)}`)).status === 400);
} finally {
  child.kill('SIGTERM');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed. Server log:\n${logs}`);
  process.exit(1);
}
console.log('\nSmoke test passed.');
