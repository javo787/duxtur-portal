import { MetadataRoute } from "next";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Doctor from "@/models/Doctor";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur-portal.vercel.app";
const languages = ["ru", "uz", "tg", "kk", "ky"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const [articles, doctors] = await Promise.all([
    Article.find({}).select("slug updatedAt title").lean(),
    Doctor.find({ status: "approved" }).select("slug _id updatedAt").lean(),
  ]);

  // Главные страницы
  const mainPages = languages.map((lang) => ({
    url: `${baseUrl}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1.0,
  }));

  // Страницы блога
  const blogPages = languages.map((lang) => ({
    url: `${baseUrl}/${lang}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Статические страницы
  const staticPages = languages.flatMap((lang) => [
    {
      url: `${baseUrl}/${lang}/authors`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/${lang}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ]);

  // Статьи — только языки где реально есть перевод
  const articlePages = articles.flatMap((article: any) => {
    const availableLangs = languages.filter(
      (lang) => article.title?.[lang] && article.title[lang].length > 0
    );
    const langs = availableLangs.length > 0 ? availableLangs : ["ru"];
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt || new Date()),
      changeFrequency: "weekly" as const,
      priority: lang === "ru" ? 0.9 : 0.75,
    }));
  });

  // Профили врачей
  const doctorPages = doctors.flatMap((doctor: any) =>
    languages.map((lang) => ({
      url: `${baseUrl}/${lang}/doctor/${doctor.slug || doctor._id}`,
      lastModified: new Date(doctor.updatedAt || new Date()),
      changeFrequency: "monthly" as const,
      priority: lang === "ru" ? 0.8 : 0.65,
    }))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...mainPages,
    ...blogPages,
    ...staticPages,
    ...articlePages,
    ...doctorPages,
  ];
}
