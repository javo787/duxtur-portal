import { MetadataRoute } from "next";
import { BASE_URL, SEO_LANGS } from "@/lib/seo";

// Spelled out per language on purpose. In robots.txt "*" also matches "/", so the old "/*/register" rule
// blocked /ru/clinic/register (the page that recruits clinics) together with the patient sign-up page.
const PRIVATE_PAGES = ["login", "register", "signup", "forgot-password", "reset-password", "search"];
// No trailing slash: /ru/admin and /ru/clinic/admin are pages themselves, and a prefix rule covers everything below them.
const PRIVATE_AREAS = ["admin", "patient", "clinic/admin"];

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    ...SEO_LANGS.flatMap((lang) => [
      ...PRIVATE_PAGES.map((page) => `/${lang}/${page}`),
      ...PRIVATE_AREAS.map((area) => `/${lang}/${area}`),
      // Sorted and searched views of the directory: canonicalized or noindexed already, nothing to gain by crawling them.
      `/${lang}/clinics?*sort=`,
      `/${lang}/clinics?*q=`,
    ]),
    "/api/", // JSON endpoints, not pages
    "/private/",
  ];

  return {
    // One group: Googlebot falls back to "*" when it has no group of its own, so the duplicate Googlebot group
    // added nothing. Crawl-delay is gone too: Google ignores it, and it only slowed Bing down.
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
