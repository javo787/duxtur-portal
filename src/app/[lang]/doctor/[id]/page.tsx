import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

type Props = {
  params: Promise<{ lang: Locale; id: string }>;
};

// Фейковые данные (потом заменим на Базу Данных)
const MOCK_DOCTOR = {
  name: "Dr. Azimov Rustam",
  specialty: { ru: "Кардиолог", uz: "Kardiolog", tg: "Кардиолог", kk: "Кардиолог", ky: "Кардиолог" },
  image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  experience: 12,
  languages: ["Русский", "Tojik", "English"],
  price: 150,
  rating: 4.9,
  reviews_count: 124,
  about: {
    ru: "Врач высшей категории. Специализируется на диагностике и лечении сердечно-сосудистых заболеваний. Провел более 5000 успешных консультаций.",
    uz: "Oliy toifali shifokor. Yurak-qon tomir kasalliklarini tashxislash va davolashga ixtisoslashgan.",
    tg: "Табиби дараҷаи олӣ. Ба ташхис ва табобати бемориҳои дилу рагҳо тахассус дорад.",
    kk: "Жоғары санатты дәрігер.",
    ky: "Жогорку категориядагы дарыгер."
  }
};

export default async function DoctorProfile(props: Props) {
  const params = await props.params;
  const { lang, id } = params;
  const dict = await getDictionary(lang);

  // Генерируем слоты времени (просто для визуала)
  const timeSlots = ["09:00", "09:30", "10:00", "11:30", "14:00", "15:30", "16:00"];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* HEADER (Упрощенный) */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-2xl font-bold text-blue-600">duxtur<span className="text-gray-400">.com</span></Link>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-400 mb-6">
          <Link href={`/${lang}`} className="hover:text-blue-600">Home</Link> / 
          <span> Doctors </span> / 
          <span className="text-gray-800 font-medium"> {MOCK_DOCTOR.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛЕВАЯ КОЛОНКА: ИНФО */}
          <div className="lg:col-span-2 space-y-6">
            {/* Карточка профиля */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden shrink-0">
                <img src={MOCK_DOCTOR.image} alt={MOCK_DOCTOR.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-blue-600 font-bold text-sm uppercase tracking-wider block mb-1">
                      {MOCK_DOCTOR.specialty[lang as keyof typeof MOCK_DOCTOR.specialty] || MOCK_DOCTOR.specialty.ru}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{MOCK_DOCTOR.name}</h1>
                    
                    {/* Рейтинг */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex text-yellow-400">
                        {"★".repeat(5)}
                      </div>
                      <span className="font-bold text-gray-900">{MOCK_DOCTOR.rating}</span>
                      <span className="text-gray-400 text-sm">({MOCK_DOCTOR.reviews_count} {dict.reviews})</span>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-end">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">{dict.doc_exp}</p>
                    <p className="font-medium text-gray-900">{MOCK_DOCTOR.experience} {dict.years}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">{dict.doc_lang}</p>
                    <div className="flex gap-1">
                      {MOCK_DOCTOR.languages.map(l => (
                        <span key={l} className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* О Враче */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-4">About Doctor</h3>
              <p className="text-gray-600 leading-relaxed">
                {MOCK_DOCTOR.about[lang as keyof typeof MOCK_DOCTOR.about] || MOCK_DOCTOR.about.ru}
              </p>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ЗАПИСЬ (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 sticky top-24">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                <span className="text-gray-500 font-medium">{dict.doc_price}</span>
                <span className="text-2xl font-bold text-blue-600">{MOCK_DOCTOR.price} {dict.somoni}</span>
              </div>

              <h4 className="font-bold text-gray-900 mb-4">Выберите время приема:</h4>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {timeSlots.map(time => (
                  <button key={time} className="py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition">
                    {time}
                  </button>
                ))}
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200">
                {dict.book_btn}
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                Оплата производится в клинике после приема
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
