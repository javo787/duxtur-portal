import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Duxtur.org",
    default: "Duxtur.org — Медицина на вашем языке",
  },
  description: "Верифицированные медицинские статьи от врачей Центральной Азии.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur.org"
  ),
  verification: {
    google: "ZcN23s2ZiPZ9vBjP4QpQ25RPjKwCikDBiyQt5o4TuA4",
  },
  openGraph: {
    siteName: "Duxtur.org",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    site: "@duxturcom",
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
  return <>{children}</>;
}
