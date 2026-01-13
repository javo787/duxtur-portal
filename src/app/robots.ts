import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/', // Например, админку можно скрыть
    },
    sitemap: 'https://duxtur.com/sitemap.xml',
  };
}
