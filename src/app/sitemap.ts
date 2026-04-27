import { MetadataRoute } from "next";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Doctor from "@/models/Doctor";

const baseUrl = "https://duxtur.com";
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

  // Статьи — только языки где реально есть перевод
  const articlePages = articles.flatMap((article: any) => {
    const availableLangs = languages.filter(
      (lang) => article.title?.[lang] && article.title[lang].length > 0
    );
    return availableLangs.map((lang) => ({
      url: `${baseUrl}/${lang}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt || new Date()),
      changeFrequency: "weekly" as const,
      priority: lang === "ru" ? 0.9 : 0.75,
    }));
  });

  // Профили врачей — только языки где есть контент
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
    ...articlePages,
    ...doctorPages,
  ];
}
