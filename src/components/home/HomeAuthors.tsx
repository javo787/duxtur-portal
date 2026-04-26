import Link from 'next/link';

export default function HomeAuthors({ lang, authors, t }: {
  lang: string;
  authors: any[];
  t: (f: any) => string;
}) {
  if (authors.length === 0) return null;

  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Наши авторы-врачи</h2>
            <p className="text-sm text-gray-400 mt-1">Верифицированные специалисты</p>
          </div>
          <Link href={`/${lang}/authors`}
            className="text-sm font-bold text-blue-600 hover:underline hidden md:block">
            Все авторы →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {authors.map((doc: any) => (
            <Link key={doc._id} href={`/${lang}/doctor/${doc.slug || doc._id}`}
              className="group flex flex-col items-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition duration-300 text-center">
              <div className="relative mb-3">
                <img
                  src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                  alt={doc.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 group-hover:border-blue-300 transition"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="font-bold text-xs text-gray-900 leading-tight line-clamp-2">{doc.name}</p>
              <p className="text-xs text-blue-500 mt-1 font-medium">{t(doc.specialty)}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6 md:hidden">
          <Link href={`/${lang}/authors`} className="text-blue-600 text-sm font-bold">Все авторы →</Link>
        </div>
      </div>
    </section>
  );
}
