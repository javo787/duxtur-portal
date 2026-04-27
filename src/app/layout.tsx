import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Duxtur.com",
    default: "Duxtur.com — Медицина на вашем языке",
  },
  description: "Верифицированные медицинские статьи от врачей Центральной Азии.",
  metadataBase: new URL("https://duxtur.com"),
  verification: {
    google: "ZcN23s2ZiPZ9vBjP4QpQ25RPjKwCikDBiyQt5o4TuA4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
