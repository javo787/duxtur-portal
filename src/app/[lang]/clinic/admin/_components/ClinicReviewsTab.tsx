'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import { SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';

export default function ClinicReviewsTab({ lang, clinicId }: { lang: string, clinicId: string }) {
  const { t } = useT(lang);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clinic/reviews?clinicId=${clinicId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 text-slate-800">
      <SectionHeader title={t('clinic.reviews')} subtitle={`Total: ${reviews.length}`} />

      {reviews.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
          <p className="text-4xl mb-4">⭐</p>
          <p className="font-bold">No reviews yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{review.isVerified ? 'Approved' : 'Pending'}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">{new Date(review.createdAt).toLocaleDateString()}</span>
               </div>
               <p className="text-slate-700 text-sm leading-relaxed italic font-medium">"{review.text}"</p>
               <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">{review.isAnonymous ? t('common.anonymous') : review.patientName || t('common.patient')}</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Doctor: {review.doctorId?.name}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
