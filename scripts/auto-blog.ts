/**
 * Auto-blog runner. Started by .github/workflows/auto-blog.yml (daily) or by hand:
 *
 *   CRON_SECRET=... GOOGLE_AI_KEY=... npx tsx scripts/auto-blog.ts
 *
 * What it does, in order:
 *   1. asks the site (GET /api/cron/auto-blog) whether an article is due and which topic is next;
 *   2. reads the sources (MedlinePlus, Europe PMC) and has Gemini write, fact-check and translate the article;
 *   3. sends the finished article to the site (POST /api/cron/auto-blog), which validates and publishes it.
 *
 * Environment:
 *   CRON_SECRET        required. Same value as in the site's environment.
 *   GOOGLE_AI_KEY      required. Free key from Google AI Studio.
 *   SITE_URL           default https://www.duxtur.org. Must be the FINAL address (no redirect): a redirect drops the
 *                      Authorization header.
 *   AUTO_BLOG_MODELS   comma-separated Gemini models, tried in order. Default: the free-tier ones.
 *   DRY_RUN=1          write the article to auto-blog-dry-run.json and print it, publish nothing.
 *   FORCE=1            ignore the "one article per 3 days" rule (manual runs).
 *
 * Exit code 0: published, or nothing to do (not due yet / paused). Non-zero: something needs a human.
 */
import fs from 'fs';
import { GenerationError, generateArticle } from '../src/lib/auto-blog/generate';
import { createGeminiLlm, LlmFatalError, parseModelList } from '../src/lib/auto-blog/llm';
import { gatherMaterial, isSufficient } from '../src/lib/auto-blog/sources';
import type { Topic } from '../src/lib/auto-blog/types';

const SITE = (process.env.SITE_URL || 'https://www.duxtur.org').replace(/\/+$/, '');
const MAX_TOPICS_PER_RUN = 3;
const DRY_RUN = process.env.DRY_RUN === '1';
const FORCE = process.env.FORCE === '1';

const log = (message: string) => console.log(`[auto-blog] ${message}`);

function need(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

type Plan = { due: true; topic: Topic } | { due: false; reason: string; nextInHours?: number };

async function site<T>(method: 'GET' | 'POST', query: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`${SITE}/api/cron/auto-blog${query}`, {
    method,
    redirect: 'manual',
    headers: { Authorization: `Bearer ${need('CRON_SECRET')}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`${SITE} redirects to ${res.headers.get('location')}. Set SITE_URL to that address: a redirect drops the Authorization header.`);
  }
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

function summary(markdown: string) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

async function main() {
  need('CRON_SECRET');
  const llm = createGeminiLlm({
    apiKey: need('GOOGLE_AI_KEY'),
    models: parseModelList(process.env.AUTO_BLOG_MODELS),
    log,
  });

  const skip: string[] = [];
  for (let n = 1; n <= MAX_TOPICS_PER_RUN; n++) {
    const query = `?force=${FORCE || DRY_RUN ? 1 : 0}${skip.length ? `&skip=${skip.join(',')}` : ''}`;
    const plan = await site<Plan & { error?: string }>('GET', query);
    if (plan.status !== 200) throw new Error(`plan request failed: HTTP ${plan.status} ${JSON.stringify(plan.data)}`);
    if (!plan.data.due) {
      const p = plan.data as { reason: string; nextInHours?: number };
      log(`Nothing to publish: ${p.reason}${p.nextInHours ? ` (next in about ${p.nextInHours} h)` : ''}`);
      summary(`**Nothing to publish:** ${p.reason}`);
      if (p.reason === 'topics-exhausted') throw new Error('All topics in src/lib/auto-blog/topics.ts are used: add new ones.');
      return;
    }

    const topic = plan.data.topic;
    log(`Topic ${n}/${MAX_TOPICS_PER_RUN}: ${topic.key} (${topic.category}), query "${topic.query}"`);

    const material = await gatherMaterial(topic, { log });
    if (!isSufficient(material)) {
      const chars = material.passages.reduce((n, q) => n + q.text.length, 0);
      log(`Not enough open-access material for "${topic.key}" (${material.passages.length} passages, ${new Set(material.passages.map((q) => q.ref.url)).size} sources, ${chars} chars; need 2+ sources and 1800+ chars), trying another topic`);
      skip.push(topic.key);
      continue;
    }
    log(`Sources: ${material.passages.map((p) => p.ref.name).join('; ')}`);

    let article;
    try {
      article = await generateArticle(material, llm, log);
    } catch (e) {
      if (e instanceof GenerationError) {
        log(`Rejected "${topic.key}": ${e.message}`);
        skip.push(topic.key);
        continue;
      }
      throw e;
    }

    const languages = Object.keys(article.languages);
    log(`Generated "${article.languages.ru!.title}" in: ${languages.join(', ')}`);

    if (DRY_RUN) {
      fs.writeFileSync('auto-blog-dry-run.json', JSON.stringify(article, null, 2));
      log('DRY_RUN: nothing published. Full article saved to auto-blog-dry-run.json');
      summary(`**Dry run OK.** Topic \`${topic.key}\`, languages: ${languages.join(', ')}.\n\n> ${article.languages.ru!.overview}`);
      return;
    }

    const res = await site<{ published?: boolean; urls?: string[]; reason?: string; details?: string[]; error?: string }>('POST', '', article);
    if (res.status === 201) {
      log(`Published: ${res.data.urls?.[0]}`);
      summary(`**Published:** ${res.data.urls?.[0]}\n\nLanguages: ${languages.join(', ')}`);
      return;
    }
    if (res.status === 409) {
      log(`Topic "${topic.key}" already has an article, trying another topic`);
      skip.push(topic.key);
      continue;
    }
    throw new Error(`publish failed: HTTP ${res.status} ${JSON.stringify(res.data).slice(0, 800)}`);
  }

  throw new Error(`No publishable article after ${MAX_TOPICS_PER_RUN} topics (skipped: ${skip.join(', ')})`);
}

main().catch((e) => {
  console.error(`[auto-blog] FAILED: ${e instanceof LlmFatalError ? 'Gemini key problem: ' : ''}${(e as Error).message}`);
  summary(`**FAILED:** ${(e as Error).message}`);
  process.exit(1);
});
