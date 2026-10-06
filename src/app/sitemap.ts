import { MetadataRoute } from "next";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import Doctor from "@/models/Doctor";
import Clinic from "@/models/Clinic";
import { CATEGORY_LABELS } from "@/lib/doctor-constants";
import { buildSitemapEntries, type SitemapArticle, type SitemapClinic, type SitemapDoctor } from "@/lib/sitemap-entries";

export const revalidate = 3600; // Регенерация каждый час

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const [articles, doctors, clinics] = await Promise.all([
    Article.find({}).select("slug updatedAt title").lean(),
    // specialty.ru: which specialty pages have a doctor (an empty page is noindex and must not be listed)
    Doctor.find({ status: "approved" }).select("slug _id updatedAt specialty.ru").lean(),
    // The directory lists approved and pre_imported clinics, so facet counts need both.
    // Which of them get a page in the sitemap is decided in buildSitemapEntries.
    Clinic.find({ status: { $in: ["approved", "pre_imported"] } })
      .select("slug status description city type specialties updatedAt")
      .lean(),
  ]);

  return buildSitemapEntries({
    articles: articles as unknown as SitemapArticle[],
    doctors: doctors as unknown as SitemapDoctor[],
    clinics: clinics as unknown as SitemapClinic[],
    doctorSpecialties: Object.fromEntries(Object.entries(CATEGORY_LABELS).map(([slug, labels]) => [slug, labels.ru])),
  });
}
