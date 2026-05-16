import { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/*/login",
          "/*/register",
          "/*/forgot-password",
          "/*/reset-password",
          "/*/signup",
          "/*/search",
          "/*/admin/",
          "/private/",
        ],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/login",
          "/*/register",
          "/*/forgot-password",
          "/*/reset-password",
          "/*/signup",
          "/*/search",
          "/*/admin/",
          "/private/",
        ],
        crawlDelay: 2,
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
