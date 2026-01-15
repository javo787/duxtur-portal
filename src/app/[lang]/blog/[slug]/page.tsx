import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';

// 1. Мета-теги
export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
  await dbConnect();
  const { slug, lang } = await params;
  const article = await Article.findOne({ slug });
  if (!article) return { title: 'Not Found' };
  
  const t = (f: any) => (f && (f[lang] || f['ru'])) || "";
  return {
    title: `${t(article.title)} | MedPoint`,
    description: t(article.overview).substring(0, 160) + '...',
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  await dbConnect();
  const { slug, lang } = await params;

  // ИСПРАВЛЕНИЕ: Добавили ': any', чтобы TypeScript не ругался на authorId.name
  // .lean() ускоряет работу, превращая результат в простой JSON
  const article: any = await Article.findOne({ slug }).populate('authorId').lean();

  if (!article) notFound();

  const t = (field: any) => {
    if (!field) return "";
    return field[lang] || field['ru'] || "";
  };
  
  const date = new Date(article.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });

  // Создаем меню навигации
  const sections = [
    { id: 'symptoms', title: 'Симптомы', content: t(article.symptoms) },
    { id: 'causes', title: 'Причины', content: t(article.causes) },
    { id: 'diagnosis', title: 'Диагностика и лечение', content: t(article.diagnosis_treatment) },
    { id: 'prevention', title: 'Профилактика', content: t(article.prevention) },
  ].filter(s => s.content && s.content.length > 0);

  return (
    <article className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      
      {/* HEADER */}
      <div className="container mx-auto max-w-4xl px-6 pt-12 pb-6">
         <nav className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
           <span>Главная</span> <span>/</span> <span>Болезни</span> <span>/</span> <span className="text-blue-600">{t(article.title)}</span>
         </nav>

         <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
           {t(article.title)}
         </h1>

         <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-2">
               <span className="font-bold text-gray-900">Автор:</span>
               {/* Здесь была ошибка. Теперь TypeScript не ругается благодаря 'any' */}
               <span className="underline decoration-blue-200 decoration-2">{article.authorId?.name || "Dr. Expert"}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-bold text-xs flex items-center">
                 ✓ Проверено врачом
               </span>
               <span className="text-gray-500">{date}</span>
            </div>
         </div>
      </div>

      {/* HERO IMAGE */}
      <div className="container mx-auto max-w-4xl px-6 mb-12">
        <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-sm">
           <img 
             src={article.image || "https://source.unsplash.com/random/800x600?medicine"} 
             alt={t(article.title)} 
             className="w-full h-full object-cover"
           />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-8">
          <div className="text-xl leading-8 text-gray-800 mb-10 font-medium">
             <ReactMarkdown>{t(article.overview)}</ReactMarkdown>
          </div>

          {/* Содержание */}
          {sections.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-12 border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Содержание</h3>
              <ul className="space-y-3">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <a href={`#${sec.id}`} className="flex items-center text-blue-700 hover:text-blue-900 font-medium group">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mr-3 group-hover:bg-blue-600 transition"></span>
                      <span className="border-b border-blue-200 group-hover:border-blue-600 transition">{sec.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-16">
            {sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-24">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {sec.title}
                </h2>
                <div className="prose prose-lg prose-slate max-w-none text-gray-700 leading-8">
                  <ReactMarkdown
                    components={{
                       strong: ({node, ...props}) => <strong className="font-bold text-gray-900 bg-yellow-50 px-1" {...props} />,
                       ul: ({node, ...props}) => <ul className="space-y-4 list-none pl-0 my-6" {...props} />,
                       li: ({node, ...props}) => (
                         <li className="flex items-start gap-4">
                           <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1 text-blue-600 font-bold text-sm">•</div>
                           <div>{props.children}</div>
                         </li>
                       )
                    }}
                  >
                    {sec.content}
                  </ReactMarkdown>
                </div>
              </section>
            ))}
          </div>
          
          {/* Источники */}
          {article.references && article.references.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
               <h4 className="font-bold text-gray-900 mb-4">Источники:</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                 {article.references.map((ref: string, i: number) => (
                   <li key={i} className="flex gap-2">
                     <span>{i+1}.</span>
                     <a href="#" className="hover:text-blue-600 hover:underline">{ref}</a>
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-8">
             <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 text-center">
                <h3 className="font-bold text-xl text-blue-900 mb-2">Нужна помощь врача?</h3>
                <p className="text-blue-700/80 mb-6">Запишитесь на прием к автору этой статьи.</p>
                <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-1">
                  Найти врача
                </button>
             </div>
          </div>
        </div>

      </div>
    </article>
  );
}
