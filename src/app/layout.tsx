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
    google: "ZcN23s2ZiPZ9vBjP4QpQ25RPjKwCikDBiyQt5o4TuA4",
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
        width: 1200,
        height: 630,
        alt: "Duxtur.org",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@duxturcom",
    images: ["https://duxtur.org/og-default.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
    "google-site-verification": "ZcN23s2ZiPZ9vBjP4QpQ25RPjKwCikDBiyQt5o4TuA4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
