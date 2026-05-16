import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { BASE_URL } from '@/lib/seo';

const LANGS = ['ru', 'uz', 'tg', 'kk', 'ky'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  if (!LANGS.includes(lang)) {
    return new NextResponse('Not found', { status: 404 });
  }

  await dbConnect();
  const articles = await Article.find({
    [`title.${lang}`]: { $exists: true, $ne: '' },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('authorId', 'name specialty')
    .lean();

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const items = articles.map((article: any) => `
    <item>
      <title><![CDATA[${t(article.title)}]]></title>
      <link>${BASE_URL}/${lang}/blog/${article.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/${lang}/blog/${article.slug}</guid>
      <description><![CDATA[${t(article.overview).substring(0, 300)}]]></description>
      <author>${article.authorId?.name || 'Duxtur.org'}</author>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      ${article.image ? `<enclosure url="${article.image}" type="image/jpeg" length="0"/>` : ''}
      <category>${article.category || 'general'}</category>
    </item>
  `).join('');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Duxtur.org — ${lang.toUpperCase()}</title>
    <link>${BASE_URL}/${lang}</link>
    <description>Медицинские статьи от врачей Центральной Азии</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/${lang}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
