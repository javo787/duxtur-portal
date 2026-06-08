interface FAQSectionProps {
  sections: { id: string; title: string; content: string }[];
  lang: string;
}

export default function FAQSection({ sections, lang }: FAQSectionProps) {
  const title = {
    ru: 'Часто задаваемые вопросы',
    uz: 'Ko\'p so\'raladigan savollar',
    tg: 'Саволҳои зуд-зуд',
    kk: 'Жиі қойылатын сұрақтар',
    ky: 'Көп берилүүчү суроолор'
  }[lang] || 'FAQ';

  return (
    <div className="mt-16 pt-10 border-t border-gray-100">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-8">{title}</h2>
      <div className="space-y-4">
        {sections.map((sec) => (
          <details key={sec.id} className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-gray-900 hover:text-blue-600 transition">
              <span>{sec.title}</span>
              <span className="shrink-0 ml-2 text-blue-500 group-open:rotate-180 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 leading-relaxed prose prose-sm max-w-none">
              {sec.content.replace(/[#*`_]/g, '')}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
