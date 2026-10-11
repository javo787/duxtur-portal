import type { Metadata } from "next";
import "./globals.css";
import { BASE_URL } from "@/lib/seo";
import { bingVerificationOther } from "@/lib/bing-verification";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | Duxtur.org",
    default: "Duxtur.org — Медицина на вашем языке",
  },
  description: "Верифицированные медицинские статьи от врачей Центральной Азии.",
  verification: {
    google: "6bOuk1K-oKwgnVTNliTZopECkE1YfNYUm7sEZTS7IHo",
    // Bing Webmaster Tools (msvalidate.01); only rendered when BING_SITE_VERIFICATION is set
    other: bingVerificationOther(),
  },
  openGraph: {
    siteName: "Duxtur.org",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: `${BASE_URL}/og-default.png`,
        width: 1424,
        height: 752,
        alt: "Duxtur.org — Медицина на вашем языке",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@duxturcom",
    images: [`${BASE_URL}/og-default.png`],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Duxtur",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // <html> and the page chrome (providers, error boundary) live in app/[lang]/layout.tsx
  return children;
}
