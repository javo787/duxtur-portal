'use client';

import { useState, use } from 'react';
import { registerDoctor } from '@/app/actions/register';
import Link from 'next/link';

// В Next.js 15 params это Promise, поэтому используем use() или async компонент (но это клиентский, так что через props)
export default function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  // Распаковываем Promise с параметрами (для Next.js 15+)
  const { lang } = use(params);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerDoctor(formData);

    setIsLoading(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      alert(result.error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border-t-4 border-yellow-400">
          <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Заявка принята!</h1>
          <p className="text-gray-600 mb-6">
            Спасибо за регистрацию, Доктор. <br/>
            Мы проверим ваш диплом в течение 24 часов. После проверки вы получите уведомление.
          </p>
          {/* Ссылка теперь ведет на правильный язык */}
          <Link href={`/${lang}`} className="text-blue-600 font-bold hover:underline">Вернуться на главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full p-8 md:p-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Регистрация Врача</h2>
          <p className="text-slate-500 mb-8 text-sm">Присоединяйтесь к закрытому сообществу MedPoint.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ФИО</label>
              <input name="name" type="text" required placeholder="Иванов Иван Иванович" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Специальность</label>
                 <input name="specialty" type="text" required placeholder="Кардиолог" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Телефон</label>
                 <input name="phone" type="tel" required placeholder="+992..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Логин)</label>
              <input name="email" type="email" required placeholder="doctor@medpoint.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Пароль</label>
              <input name="password" type="password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>

            <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-6 text-center hover:bg-blue-100 transition cursor-pointer group">
              <label className="cursor-pointer block">
                <span className="block text-2xl mb-2 group-hover:scale-110 transition">📄</span>
                <span className="font-bold text-blue-700 block mb-1">Загрузить фото Диплома</span>
                <span className="text-xs text-blue-400">Обязательно для проверки</span>
                <input name="diploma" type="file" accept="image/*" required className="hidden" />
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isLoading ? 'Отправка...' : 'Подать заявку →'}
            </button>
          </form>
          
          <p className="text-center mt-6 text-sm text-gray-400">
            Уже есть аккаунт? <Link href={`/${lang}/login`} className="text-blue-600 font-bold">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
