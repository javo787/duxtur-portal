import Link from 'next/link';

export default function HomeFooter({ lang }: { lang: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Бренд */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${lang}`} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-extrabold text-gray-900">duxtur<span className="text-blue-600">.com</span></span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Медицинский контент-портал Центральной Азии. Достоверные статьи от практикующих врачей.
            </p>
          </div>

          {/* Читателям */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Читателям</h4>
            <ul className="space-y-2.5">
              {[
                { href: `/${lang}/blog`, label: 'Все статьи' },
                { href: `/${lang}/authors`, label: 'Авторы-врачи' },
                { href: `/${lang}/search`, label: 'Поиск' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-blue-600 transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Врачам */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Врачам</h4>
            <ul className="space-y-2.5">
              {[
                { href: `/${lang}/register`, label: 'Стать автором' },
                { href: `/${lang}/login`, label: 'Войти в кабинет' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-blue-600 transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Контакты</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition">
                  <svg className="w-4 h-4 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
                  </svg>
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {currentYear} Duxtur.com — Все права защищены</p>
          <p>Информация на сайте носит ознакомительный характер. Проконсультируйтесь с врачом.</p>
        </div>
      </div>
    </footer>
  );
}
