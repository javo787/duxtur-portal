import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';

const baseUrl = 'https://duxtur.com';
const languages = ['ru', 'uz', 'tg', 'kk', 'ky'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const [articles, doctors] = await Promise.all([
    Article.find({}).select('slug updatedAt').lean(),
    Doctor.find({ status: 'approved' }).select('slug _id updatedAt').lean(),
  ]);

  // Главные страницы
  const mainPages = languages.map((lang) => ({
    url: `${baseUrl}/${lang}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // Страницы блога
  const blogPages = languages.map((lang) => ({
    url: `${baseUrl}/${lang}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Статьи — для каждого языка
  const articlePages = articles.flatMap((article: any) =>
    languages.map((lang) => ({
      url: `${baseUrl}/${lang}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  // Профили врачей
  const doctorPages = doctors.flatMap((doctor: any) =>
    languages.map((lang) => ({
      url: `${baseUrl}/${lang}/doctor/${doctor.slug || doctor._id}`,
      lastModified: new Date(doctor.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...mainPages,
    ...blogPages,
    ...articlePages,
    ...doctorPages,
  ];
}
