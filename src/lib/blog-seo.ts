/**
 * Blog category landing pages (/blog/c/<slug>) exist for these categories only. The home page and the search
 * page offer more categories (ophthalmology, surgery, ...): for those the link stays a filter of the main list.
 * blog-seo.test.ts checks this list against the landing page itself.
 */
export const BLOG_CATEGORY_PAGES = ['cardiology', 'neurology', 'dentistry', 'pediatrics', 'dermatology'] as const;

export function hasBlogCategoryPage(slug: string | undefined): slug is (typeof BLOG_CATEGORY_PAGES)[number] {
  return !!slug && (BLOG_CATEGORY_PAGES as readonly string[]).includes(slug);
}

/** Where a category link should point: the landing page when there is one, otherwise the filter on the list. */
export function blogCategoryHref(lang: string, slug: string): string {
  return hasBlogCategoryPage(slug) ? `/${lang}/blog/c/${slug}` : `/${lang}/blog?category=${encodeURIComponent(slug)}`;
}

/**
 * The path (without the language) a /blog URL canonicalizes to. `?category=cardiology` lists exactly what the
 * cardiology landing page lists, so the landing page is its canonical; other categories fall back to the index.
 */
export function blogListingCanonicalPath(category: string | undefined): string {
  return hasBlogCategoryPage(category) ? `blog/c/${category}` : 'blog';
}
