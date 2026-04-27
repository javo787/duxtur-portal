import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur-portal.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/private/", "/*/admin/", "/*/login/", "/*/register/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
