import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BLOG_CATEGORY_PAGES, blogCategoryHref, blogListingCanonicalPath, hasBlogCategoryPage } from './blog-seo';

describe('blogCategoryHref', () => {
  it('goes straight to the landing page for a category that has one', () => {
    expect(blogCategoryHref('ru', 'cardiology')).toBe('/ru/blog/c/cardiology');
    expect(blogCategoryHref('tg', 'dermatology')).toBe('/tg/blog/c/dermatology');
  });

  it('keeps the filter on the list for a category without a landing page, never a link that would 404', () => {
    expect(blogCategoryHref('ru', 'surgery')).toBe('/ru/blog?category=surgery');
    expect(blogCategoryHref('uz', 'a b')).toBe('/uz/blog?category=a%20b');
  });
});

describe('blogListingCanonicalPath', () => {
  it('points ?category= at the landing page when there is one, otherwise at the index', () => {
    expect(blogListingCanonicalPath('neurology')).toBe('blog/c/neurology');
    expect(blogListingCanonicalPath('ophthalmology')).toBe('blog');
    expect(blogListingCanonicalPath('constructor')).toBe('blog');
    expect(blogListingCanonicalPath(undefined)).toBe('blog');
    expect(blogListingCanonicalPath('')).toBe('blog');
  });
});

describe('hasBlogCategoryPage', () => {
  it('knows exactly the listed categories', () => {
    for (const slug of BLOG_CATEGORY_PAGES) expect(hasBlogCategoryPage(slug)).toBe(true);
    expect(hasBlogCategoryPage('surgery')).toBe(false);
    expect(hasBlogCategoryPage(undefined)).toBe(false);
  });
});

// A landing page missing here would lose its canonical; one listed here but missing there would 404 from the home page.
describe('BLOG_CATEGORY_PAGES against the landing page', () => {
  const source = readFileSync(path.join(process.cwd(), 'src/app/[lang]/blog/c/[category]/page.tsx'), 'utf8');
  const pageSlugs = [...source.matchAll(/slug:\s*'([a-z-]+)'/g)].map((m) => m[1]);

  it('lists the same categories as the page that serves them', () => {
    expect([...pageSlugs].sort()).toEqual([...BLOG_CATEGORY_PAGES].sort());
  });
});
