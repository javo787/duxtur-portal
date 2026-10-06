import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_URL } from './seo';

/**
 * Search Console showed www.duxtur.org pages as "alternate page with proper canonical tag": the site answers on
 * www, while every canonical pointed at the bare duxtur.org. A canonical must name the host that answers 200.
 * This keeps a second host out of everything a crawler reads.
 */
const ROOT = process.cwd();
const APEX = 'https://duxtur.org';

function walk(dir: string, skip: (name: string) => boolean): string[] {
  return readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    if (skip(entry.name)) return [];
    const rel = path.posix.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel, skip) : [rel];
  });
}

// Pages, layouts, the sitemap, robots and the feed: everything whose output a search engine reads.
const crawlerFacing = walk('src/app', (name) => ['api', 'admin', 'node_modules'].includes(name)).filter(
  (file) => /(^|\/)(page|layout)\.tsx$|(^|\/)(sitemap|robots)\.ts$|feed\.xml\/route\.ts$/.test(file),
);

const seoLibraries = ['seo', 'sitemap-entries', 'clinic-seo', 'doctor-seo', 'blog-seo'].map((name) => `src/lib/${name}.ts`);

describe('one canonical host', () => {
  it('is the host that answers without a redirect', () => {
    expect(BASE_URL).toBe('https://www.duxtur.org');
  });

  it('finds the files it is meant to guard', () => {
    expect(crawlerFacing.length).toBeGreaterThan(15);
    expect(crawlerFacing).toContain('src/app/layout.tsx');
    expect(crawlerFacing).toContain('src/app/sitemap.ts');
    expect(crawlerFacing).toContain('src/app/robots.ts');
  });

  it('is not contradicted by a hard-coded second host in anything a crawler reads', () => {
    const offenders = [...crawlerFacing, ...seoLibraries, 'next.config.ts', 'src/middleware.ts'].filter((file) =>
      readFileSync(path.join(ROOT, file), 'utf8').includes(APEX),
    );
    expect(offenders).toEqual([]);
  });
});
