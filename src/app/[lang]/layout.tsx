import { Inter, Fraunces } from "next/font/google";
import "../globals.css";
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { BASE_URL } from "@/lib/seo";
import { Locale } from "@/i18n";

export async function generateMetadata() {
  return {
    other: {
      "link:preconnect:fonts": "https://fonts.googleapis.com",
      "link:preconnect:fonts-static": "https://fonts.gstatic.com",
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = (await params) as { lang: Locale };
  const session = await auth();

  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme && supportDarkMode) theme = 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`Duxtur.org RSS — ${lang}`}
          href={`${BASE_URL}/${lang}/feed.xml`}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
