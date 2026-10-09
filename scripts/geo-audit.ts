/**
 * GEO audit CLI: asks ChatGPT (OpenAI Responses API + web_search) and Gemini (Google Search grounding)
 * the questions in scripts/geo-audit.prompts.json and reports whether duxtur.org is cited.
 *
 *   npm run geo:audit                       both engines that have a key
 *   npm run geo:audit -- --engines openai   one engine
 *   npm run geo:audit -- --lang ru --limit 5
 *   npm run geo:audit -- --dry-run          list the questions, call nothing
 *
 * Keys (env or .env.local): OPENAI_API_KEY, GEMINI_API_KEY. Optional: OPENAI_MODEL, GEMINI_MODEL.
 * Output: reports/geo-audit/<timestamp>.json (every answer and source) and .md (summary).
 * Every question is one paid API call per engine; the default set is 25 questions.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  ENGINES,
  PROMPT_LANGS,
  askGemini,
  askOpenAI,
  renderMarkdown,
  summarize,
  validatePrompts,
  type AnswerResult,
  type AuditPrompt,
  type Engine,
} from '../src/lib/geo-audit';

const DEFAULT_MODELS: Record<Engine, string> = {
  // Override with OPENAI_MODEL / GEMINI_MODEL if the default has been retired; API errors are printed as-is.
  openai: process.env.OPENAI_MODEL || 'gpt-4.1',
  gemini: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const promptsPath = path.resolve(process.cwd(), typeof args.prompts === 'string' ? args.prompts : 'scripts/geo-audit.prompts.json');
  let prompts: AuditPrompt[];
  try {
    prompts = validatePrompts(JSON.parse(fs.readFileSync(promptsPath, 'utf8')));
  } catch (e) {
    fail(`Cannot load prompts from ${promptsPath}: ${e instanceof Error ? e.message : e}`);
  }

  if (typeof args.lang === 'string') {
    if (!(PROMPT_LANGS as readonly string[]).includes(args.lang)) fail(`--lang must be one of ${PROMPT_LANGS.join(', ')}`);
    prompts = prompts.filter((p) => p.lang === args.lang);
  }
  if (typeof args.limit === 'string') {
    const n = Number(args.limit);
    if (!Number.isInteger(n) || n < 1) fail('--limit must be a positive integer');
    prompts = prompts.slice(0, n);
  }
  if (prompts.length === 0) fail('No prompts left after filtering.');

  const requested: Engine[] = typeof args.engines === 'string' ? (args.engines.split(',').map((s) => s.trim()) as Engine[]) : [...ENGINES];
  for (const e of requested) if (!ENGINES.includes(e)) fail(`Unknown engine "${e}". Use: ${ENGINES.join(', ')}`);

  if (args['dry-run']) {
    console.log(`${prompts.length} questions, engines: ${requested.join(', ')} (nothing is sent)\n`);
    for (const p of prompts) console.log(`[${p.lang}/${p.intent}] ${p.text}`);
    return;
  }

  const keys: Record<Engine, string | undefined> = { openai: process.env.OPENAI_API_KEY, gemini: process.env.GEMINI_API_KEY };
  const engines = requested.filter((e) => {
    if (keys[e]) return true;
    console.warn(`! ${e}: ${e === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'} is not set, skipping`);
    return false;
  });
  if (engines.length === 0) fail('No API keys available. Set OPENAI_API_KEY and/or GEMINI_API_KEY.');

  console.log(`Asking ${prompts.length} questions on: ${engines.map((e) => `${e} (${DEFAULT_MODELS[e]})`).join(', ')}\n`);

  // Engines run side by side; questions go one at a time per engine to stay under rate limits.
  const runEngine = async (engine: Engine): Promise<AnswerResult[]> => {
    const out: AnswerResult[] = [];
    for (const [i, p] of prompts.entries()) {
      const opts = { apiKey: keys[engine]!, model: DEFAULT_MODELS[engine] };
      const r = engine === 'openai' ? await askOpenAI(p, opts) : await askGemini(p, opts);
      out.push(r);
      const tag = !r.ok ? `ERROR ${r.error}` : r.cited ? 'CITED' : r.mentioned ? 'named' : r.searched ? 'not cited' : 'no search';
      console.log(`${engine.padEnd(6)} ${String(i + 1).padStart(2)}/${prompts.length} ${p.id}: ${tag}`);
    }
    return out;
  };
  const results = (await Promise.all(engines.map(runEngine))).flat();

  const date = new Date().toISOString().slice(0, 10);
  const summary = summarize(results);
  const md = renderMarkdown(summary, { date, models: DEFAULT_MODELS, promptCount: prompts.length });

  const dir = path.resolve(process.cwd(), 'reports/geo-audit');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(dir, `${stamp}.json`), JSON.stringify({ date, models: DEFAULT_MODELS, summary, results }, null, 2));
  fs.writeFileSync(path.join(dir, `${stamp}.md`), md);

  console.log(`\n${md}\nSaved to reports/geo-audit/${stamp}.{json,md}`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
