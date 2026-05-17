import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://duxtur.org"),
  title: {
    template: "%s | Duxtur.org",
    default: "Duxtur.org — Медицина на вашем языке",
  },
  description: "Верифицированные медицинские статьи от врачей Центральной Азии.",
  verification: {
    google: "6bOuk1K-oKwgnVTNliTZopECkE1YfNYUm7sEZTS7IHo",
  },
  alternates: {
    canonical: "https://duxtur.org",
  },
  openGraph: {
    siteName: "Duxtur.org",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: "https://duxtur.org/og-default.png",
        width: 1424,
        height: 752,
        alt: "Duxtur.org — Медицина на вашем языке",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@duxturcom",
    images: ["https://duxtur.org/og-default.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
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
  other: {
    "google-site-verification": "6bOuk1K-oKwgnVTNliTZopECkE1YfNYUm7sEZTS7IHo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
