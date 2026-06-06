import { MetadataRoute } from "next";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Doctor from "@/models/Doctor";
import Clinic from "@/models/Clinic";
import { BASE_URL } from "@/lib/seo";
import { CATEGORY_LABELS } from "@/lib/doctor-constants";

export const revalidate = 3600; // Регенерация каждый час

const languages = ["ru", "uz", "tg", "kk", "ky"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const [articles, doctors, clinics] = await Promise.all([
    Article.find({}).select("slug updatedAt title").lean(),
    Doctor.find({ status: "approved" }).select("slug _id updatedAt").lean(),
    Clinic.find({ status: "approved" }).select("slug updatedAt").lean(),
  ]);

  // Главные страницы (priority 1.0, daily)
  const mainPages = languages.map((lang) => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1.0,
  }));

  // Страницы блога (priority 0.9, daily)
  const blogPages = languages.map((lang) => ({
    url: `${BASE_URL}/${lang}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Поиск врачей (priority 0.9, daily)
  const doctorSearchPages = languages.flatMap((lang) => [
    {
      url: `${BASE_URL}/${lang}/doctors`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${lang}/doctors/map`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ]);

  // Авторы (priority 0.8, weekly)
  const authorListPages = languages.map((lang) => ({
    url: `${BASE_URL}/${lang}/authors`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const clinicDirectoryPages = languages.map((lang) => ({
    url: `${BASE_URL}/${lang}/clinics`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const clinicProfilePages = clinics.flatMap((clinic: any) =>
    languages.map((lang) => ({
      url: `${BASE_URL}/${lang}/clinic/${clinic.slug}`,
      lastModified: new Date(clinic.updatedAt || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  // Пациенты (noindex)
  const patientPages = languages.map((lang) => ({
    url: `${BASE_URL}/${lang}/patient/appointments`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  // Статические страницы (priority 0.6, monthly)
  const staticPages = languages.flatMap((lang) => [
    {
      url: `${BASE_URL}/${lang}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/${lang}/editorial`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]);

  // Статьи — только языки где реально есть перевод (priority 0.85, weekly)
  const articlePages = articles.flatMap((article: any) => {
    const availableLangs = languages.filter(
      (lang) => article.title?.[lang] && article.title[lang].trim().length > 5
    );

    // Если переводов нет совсем — пропускаем статью
    if (availableLangs.length === 0) return [];

    return availableLangs.map((lang) => ({
      url: `${BASE_URL}/${lang}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  });

  // Профили врачей (priority 0.75, monthly)
  const doctorPages = doctors.flatMap((doctor: any) =>
    languages.map((lang) => ({
      url: `${BASE_URL}/${lang}/doctor/${doctor.slug || doctor._id}`,
      lastModified: new Date(doctor.updatedAt || new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }))
  );

  // Страницы специалистов по категориям (priority 0.85, weekly)
  const specialtyPages = Object.keys(CATEGORY_LABELS).flatMap((specialty) =>
    languages.map((lang) => ({
      url: `${BASE_URL}/${lang}/doctors/${specialty}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }))
  );

  return [
    ...mainPages,
    ...blogPages,
    ...doctorSearchPages,
    ...authorListPages,
    ...clinicDirectoryPages,
    ...clinicProfilePages,
    ...patientPages,
    ...staticPages,
    ...articlePages,
    ...doctorPages,
    ...specialtyPages,
  ];
}
