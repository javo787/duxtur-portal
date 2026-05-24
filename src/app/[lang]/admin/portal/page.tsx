import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import {
  updateDoctorStatus, deleteDoctor, deleteArticle, toggleDoctorBan, approveArticle, approveReview, deleteReview,
  approveClinic, rejectClinic, deleteClinic, banClinic
} from '@/app/actions/admin';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ActionBtn } from '@/app/[lang]/admin/_components/ActionBtn'; 
import PlacesSection from './_components/PlacesSection';
import AdminAIAssistantWrapper from './AdminAIAssistantWrapper';

export default async function PortalAdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const session = await auth();
  const { lang } = await params;

  if (!session || (session.user as any)?.role !== 'portal_admin') {
    redirect(`/${lang}/login`);
  }

  await dbConnect();

  const Review = (await import('@/models/Review')).default;

  const [
    pendingDoctors, approvedDoctors, bannedDoctors, rejectedDoctors,
    pendingArticles, publishedArticles, totalArticles,
    totalUsers,
    pendingReviews,
    pendingClinics, approvedClinics
  ] = await Promise.all([
    Doctor.find({ status: 'pending' }).sort({ createdAt: -1 }).lean(),
    Doctor.find({ status: 'approved' }).sort({ createdAt: -1 }).lean(),
    Doctor.find({ status: 'banned' }).sort({ createdAt: -1 }).lean(),
    Doctor.find({ status: 'rejected' }).sort({ createdAt: -1 }).lean(),
    Article.find({ isVerified: false }).sort({ createdAt: -1 }).populate('authorId').lean(),
    Article.find({ isVerified: true }).sort({ createdAt: -1 }).limit(20).populate('authorId').lean(),
    Article.countDocuments(),
    User.countDocuments(),
    Review.find({ isVerified: false }).sort({ createdAt: -1 }).populate('doctorId').lean(),
    Clinic.find({ status: 'pending' }).sort({ createdAt: -1 }).lean(),
    Clinic.find({ status: 'approved' }).sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white">

      {/* HEADER */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}`} className="text-gray-500 hover:text-white text-sm transition">← На сайт</Link>
          <span className="text-gray-700">|</span>
          <h1 className="font-extrabold text-lg">
            duxtur<span className="text-blue-400">.com</span>
            <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Admin Portal</span>
          </h1>
        </div>
        <span className="text-xs text-gray-500 hidden md:block">Супер-администратор</span>
      </header>

      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">

        {/* МЕСТА (КЛИНИКИ И Т.Д.) */}
        <PlacesSection />

        {/* СТАТИСТИКА */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Заявки" value={pendingDoctors.length} color="bg-yellow-900/40 border-yellow-700 text-yellow-400" icon="⏳" urgent={pendingDoctors.length > 0} />
          <StatCard label="Клиники" value={pendingClinics.length} color="bg-blue-900/40 border-blue-700 text-blue-400" icon="🏥" urgent={pendingClinics.length > 0} />
          <StatCard label="Авторов" value={approvedDoctors.length} color="bg-green-900/40 border-green-700 text-green-400" icon="✅" />
          <StatCard label="Статей" value={totalArticles} color="bg-blue-900/40 border-blue-700 text-blue-400" icon="📄" />
          <StatCard label="На модерации" value={pendingArticles.length} color="bg-amber-900/40 border-amber-700 text-amber-400" icon="📝" urgent={pendingArticles.length > 0} />
          <StatCard label="Забанено" value={bannedDoctors.length} color="bg-red-900/40 border-red-700 text-red-400" icon="🚫" />
          <StatCard label="Пользователей" value={totalUsers} color="bg-purple-900/40 border-purple-700 text-purple-400" icon="👥" />
        </div>

        {/* НОВЫЕ ЗАЯВКИ */}
        <Section title="Новые заявки (Врачи)" badge={pendingDoctors.length} badgeColor="bg-red-500">
          {pendingDoctors.length === 0 ? (
            <Empty icon="🎉" text="Все заявки обработаны" />
          ) : (
            <div className="grid gap-4">
              {pendingDoctors.map((doc: any) => (
                <div key={doc._id} className="bg-gray-900 p-6 rounded-2xl border border-yellow-900/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Диплом */}
                  <a href={doc.documentImage} target="_blank" rel="noopener noreferrer"
                    className="w-full md:w-44 h-28 bg-gray-800 rounded-xl overflow-hidden shrink-0 relative group block">
                    <img src={doc.documentImage} alt="Диплом" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                      🔍 Открыть
                    </div>
                  </a>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-lg font-bold text-white">{doc.name}</h3>
                        <p className="text-blue-400 text-sm">{doc.specialty?.ru || '—'}</p>
                      </div>
                      <span className="bg-yellow-900/50 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-700">
                        На проверке
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                      <span className="bg-gray-800 px-3 py-1 rounded-lg">📞 {doc.phone}</span>
                      <span className="bg-gray-800 px-3 py-1 rounded-lg">📅 {new Date(doc.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <ActionBtn
                        action={updateDoctorStatus.bind(null, doc._id.toString(), 'approved')}
                        label="✅ Одобрить"
                        color="bg-green-600 hover:bg-green-700"
                      />
                      <ActionBtn
                        action={updateDoctorStatus.bind(null, doc._id.toString(), 'rejected')}
                        label="❌ Отклонить"
                        color="bg-red-600 hover:bg-red-700"
                      />
                      <ActionBtn
                        action={deleteDoctor.bind(null, doc._id.toString())}
                        label="🗑 Удалить"
                        color="bg-gray-600 hover:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* НОВЫЕ КЛИНИКИ */}
        <Section title="Новые клиники" badge={pendingClinics.length} badgeColor="bg-blue-500">
          {pendingClinics.length === 0 ? (
            <Empty icon="🏥" text="Нет новых заявок от клиник" />
          ) : (
            <div className="grid gap-4">
              {pendingClinics.map((clinic: any) => (
                <div key={clinic._id} className="bg-gray-900 p-6 rounded-2xl border border-blue-900/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-800">
                    <img src={clinic.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-lg font-bold text-white">{clinic.name?.ru}</h3>
                        <span className="text-[10px] font-black uppercase bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-700">
                          {clinic.type}
                        </span>
                      </div>
                      <span className="bg-yellow-900/50 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-700">
                        На проверке
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                      <span className="bg-gray-800 px-3 py-1 rounded-lg">📍 {clinic.city}</span>
                      <span className="bg-gray-800 px-3 py-1 rounded-lg">📞 {clinic.phone}</span>
                      <a href={clinic.licenseDocument} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-600/40 transition">
                        📋 Лицензия
                      </a>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <ActionBtn
                        action={approveClinic.bind(null, clinic._id.toString())}
                        label="✅ Одобрить"
                        color="bg-green-600 hover:bg-green-700"
                      />
                      <ActionBtn
                        action={rejectClinic.bind(null, clinic._id.toString())}
                        label="❌ Отклонить"
                        color="bg-red-600 hover:bg-red-700"
                      />
                      <ActionBtn
                        action={deleteClinic.bind(null, clinic._id.toString())}
                        label="🗑 Удалить"
                        color="bg-gray-600 hover:bg-gray-700"
                        confirm="Удалить клинику и аккаунт владельца?"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ОТЗЫВЫ НА МОДЕРАЦИИ */}
        <Section title="Отзывы на модерации" badge={pendingReviews.length} badgeColor="bg-purple-500">
          {pendingReviews.length === 0 ? (
            <Empty icon="⭐" text="Нет новых отзывов" />
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review: any) => (
                <div key={review._id} className="bg-gray-900 p-4 rounded-2xl border border-purple-900/40 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">
                        ⭐ {review.rating}/5
                      </span>
                      <span className="text-xs text-gray-400">
                        Врач: {(review.doctorId as any)?.name || 'Неизвестен'}
                      </span>
                    </div>
                    <p className="text-sm text-white italic">"{review.text}"</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      📅 {new Date(review.createdAt).toLocaleDateString('ru')} · {review.isAnonymous ? 'Анонимно' : 'От пациента'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <ActionBtn
                      action={approveReview.bind(null, review._id.toString())}
                      label="✅ Одобрить"
                      color="bg-green-600 hover:bg-green-700"
                    />
                    <ActionBtn
                      action={deleteReview.bind(null, review._id.toString())}
                      label="🗑 Удалить"
                      color="bg-red-800 hover:bg-red-700"
                      confirm="Удалить отзыв?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ОДОБРЕННЫЕ КЛИНИКИ */}
        <Section title="Одобренные клиники" badge={approvedClinics.length} badgeColor="bg-emerald-600">
          {approvedClinics.length === 0 ? (
            <Empty icon="🏥" text="Нет одобренных клиник" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedClinics.map((clinic: any) => (
                <div key={clinic._id} className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-800">
                    <img src={clinic.logo || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{clinic.name?.ru}</p>
                    <p className="text-xs text-blue-400">{clinic.type} · {clinic.city}</p>
                    <p className="text-[10px] text-gray-500 mt-1">👨‍⚕️ Врачей: {clinic.doctorIds?.length || 0}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/${lang}/clinic/${clinic.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white transition text-center"
                    >
                      👁 Профиль
                    </Link>
                    <ActionBtn
                      action={banClinic.bind(null, clinic._id.toString(), true)}
                      label="🚫 Бан"
                      color="bg-orange-700 hover:bg-orange-600"
                    />
                    <ActionBtn
                      action={deleteClinic.bind(null, clinic._id.toString())}
                      label="🗑 Удалить"
                      color="bg-red-800 hover:bg-red-700"
                      confirm="Удалить клинику безвозвратно?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* АКТИВНЫЕ АВТОРЫ */}
        <Section title="Активные авторы" badge={approvedDoctors.length} badgeColor="bg-green-600">
          {approvedDoctors.length === 0 ? (
            <Empty icon="👨‍⚕️" text="Нет активных авторов" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedDoctors.map((doc: any) => (
                <DoctorCard key={doc._id} doc={doc} lang={lang} />
              ))}
            </div>
          )}
        </Section>

        {/* СТАТЬИ НА МОДЕРАЦИИ */}
<Section title="Статьи на модерации" badge={pendingArticles.length} badgeColor="bg-amber-500">
  {pendingArticles.length === 0 ? (
    <Empty icon="🎉" text="Нет статей на модерации" />
  ) : (
    <div className="space-y-3">
      {pendingArticles.map((article: any) => (
        <div key={article._id} className="bg-gray-900 p-4 rounded-2xl border border-amber-900/40 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-800">
            <img src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200'} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-amber-900/50 text-amber-400 border border-amber-700 px-2 py-0.5 rounded-full">⏳ На модерации</span>
              {article.aiGenerated === false && (
                <span className="text-xs font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">✍️ Вручную</span>
              )}
            </div>
            <p className="font-bold text-white text-sm truncate">
              {article.title?.ru || article.title?.uz || article.title?.tg || 'Без названия'}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">👤 {(article.authorId as any)?.name || 'Неизвестен'}</span>
              <span className="text-xs text-gray-500">📅 {new Date(article.createdAt).toLocaleDateString('ru')}</span>
              {article.category && <span className="text-xs text-gray-500">{article.category}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <ActionBtn
              action={approveArticle.bind(null, article._id.toString())}
              label="✅ Одобрить"
              color="bg-green-600 hover:bg-green-700"
            />
            <ActionBtn
              action={deleteArticle.bind(null, article._id.toString())}
              label="🗑 Удалить"
              color="bg-red-800 hover:bg-red-700"
              confirm="Удалить статью безвозвратно?"
            />
          </div>
        </div>
      ))}
    </div>
  )}
</Section>

{/* ОПУБЛИКОВАННЫЕ СТАТЬИ */}
<Section title="Опубликованные статьи" badge={totalArticles} badgeColor="bg-blue-600">
  {publishedArticles.length === 0 ? (
    <Empty icon="📄" text="Нет статей" />
  ) : (
    <div className="space-y-3">
      {publishedArticles.map((article: any) => (
        <div key={article._id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-800">
            <img src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200'} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">
              {article.title?.ru || article.title?.uz || article.title?.tg || 'Без названия'}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">👤 {(article.authorId as any)?.name || 'Неизвестен'}</span>
              <span className="text-xs text-gray-500">📅 {new Date(article.createdAt).toLocaleDateString('ru')}</span>
              <span className="text-xs text-green-500">👁 {article.views || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/${lang}/blog/${article.slug}`} target="_blank"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white transition">
              👁 Просмотр
            </Link>
            <ActionBtn
              action={deleteArticle.bind(null, article._id.toString())}
              label="🗑 Удалить"
              color="bg-red-800 hover:bg-red-700"
              confirm="Удалить статью?"
            />
          </div>
        </div>
      ))}
    </div>
  )}
</Section>

        {/* ЗАБАНЕННЫЕ */}
        {bannedDoctors.length > 0 && (
          <Section title="Забаненные" badge={bannedDoctors.length} badgeColor="bg-red-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bannedDoctors.map((doc: any) => (
                <div key={doc._id} className="bg-gray-900 p-4 rounded-2xl border border-red-900/50 flex items-center gap-4">
                  <img
                    src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                    alt={doc.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-900 shrink-0 opacity-60"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-400 truncate">{doc.name}</p>
                    <p className="text-xs text-red-500">{doc.specialty?.ru}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <ActionBtn
                      action={toggleDoctorBan.bind(null, doc._id.toString(), false)}
                      label="Разбанить"
                      color="bg-green-700 hover:bg-green-600"
                    />
                    <ActionBtn
                      action={deleteDoctor.bind(null, doc._id.toString())}
                      label="🗑"
                      color="bg-red-800 hover:bg-red-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ОТКЛОНЁННЫЕ */}
        {rejectedDoctors.length > 0 && (
          <Section title="Отклонённые заявки" badge={rejectedDoctors.length} badgeColor="bg-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedDoctors.map((doc: any) => (
                <div key={doc._id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-400 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.specialty?.ru} · {doc.phone}</p>
                    <p className="text-xs text-gray-600">{new Date(doc.createdAt).toLocaleDateString('ru')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <ActionBtn
                      action={updateDoctorStatus.bind(null, doc._id.toString(), 'approved')}
                      label="✅ Одобрить"
                      color="bg-green-700 hover:bg-green-600"
                    />
                    <ActionBtn
                      action={deleteDoctor.bind(null, doc._id.toString())}
                      label="🗑"
                      color="bg-red-800 hover:bg-red-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
      <AdminAIAssistantWrapper />
    </div>
  );
}

// ─── Карточка врача с действиями ───
function DoctorCard({ doc, lang }: { doc: any; lang: string }) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
      <img
        src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
        alt={doc.name}
        className="w-14 h-14 rounded-full object-cover border-2 border-green-900 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{doc.name}</p>
        <p className="text-sm text-blue-400">{doc.specialty?.ru}</p>
        <p className="text-xs text-gray-500 mt-0.5">📞 {doc.phone}</p>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <Link
          href={`/${lang}/doctor/${doc.slug || doc._id}`}
          target="_blank"
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white transition text-center"
        >
          👁 Профиль
        </Link>
        <ActionBtn
          action={toggleDoctorBan.bind(null, doc._id.toString(), true)}
          label="🚫 Бан"
          color="bg-orange-700 hover:bg-orange-600"
        />
        <ActionBtn
          action={deleteDoctor.bind(null, doc._id.toString())}
          label="🗑 Удалить"
          color="bg-red-800 hover:bg-red-700"
        />
      </div>
    </div>
  );
}

// ─── Переиспользуемые компоненты ───
function Section({ title, badge, badgeColor, children }: {
  title: string;
  badge?: number;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-extrabold text-white">{title}</h2>
        {badge !== undefined && badge > 0 && (
          <span className={`${badgeColor} text-white text-xs font-extrabold px-2.5 py-1 rounded-full`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, color, icon, urgent }: {
  label: string; value: number; color: string; icon: string; urgent?: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border ${color} flex items-center gap-4 ${urgent ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-gray-950' : ''}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
        <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
      </div>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-gray-900 p-10 rounded-2xl text-center text-gray-600 border border-gray-800">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-medium">{text}</p>
    </div>
  );
}
