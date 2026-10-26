import type { Metadata } from 'next';
import { assertAdminPage } from '@/lib/admin-content/guard';
import { WriteTab } from '@/app/[lang]/admin/_components/WriteTab';
import AdminShell from '../../_shared/AdminShell';

export const metadata: Metadata = {
  title: 'Новая статья | Duxtur Admin',
  robots: { index: false, follow: false },
};

/**
 * The super admin writes an article with the same editor the doctors use (AI draft, AI processing, translation or
 * the manual editor). The article is published at once under the byline «Редакция Duxtur».
 */
export default async function NewArticlePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await assertAdminPage(lang);

  return (
    <AdminShell
      lang={lang}
      active="write"
      title="Новая статья"
      description="Подпись: «Редакция Duxtur». Статья публикуется сразу и отмечается как проверенная."
    >
      {/* The editor is a light "sheet of paper" on the dark portal, like the editors of Notion or Ghost. */}
      <div className="rounded-3xl bg-gray-50 p-3 text-gray-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:p-6">
        <WriteTab lang={lang} adminMode autoTutorial={false} />
      </div>
    </AdminShell>
  );
}
