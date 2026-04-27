const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur-portal.vercel.app";

const LANGS = ["ru", "uz", "tg", "kk", "ky"] as const;

export function buildAlternates(path: string) {
  return {
    canonical: `${BASE_URL}/ru/${path}`,
    languages: Object.fromEntries(
      LANGS.map((l) => [l, `${BASE_URL}/${l}/${path}`])
    ),
  };
}
