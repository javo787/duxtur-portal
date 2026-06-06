'use client';

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/i18n';
import { SectionHeader, Spinner } from '@/app/[lang]/admin/_components/_profile-sections/_shared';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClinicDoctorsTab({ lang, clinicId }: { lang: string, clinicId: string }) {
  const { t } = useT(lang);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=doctors&lang=${lang}`);
          const data = await res.json();
          setSuggestions(data.doctors || []);
          setShowSuggestions(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [docsRes, invRes] = await Promise.all([
        fetch(`/api/clinic/doctors?clinicId=${clinicId}`),
        fetch(`/api/clinic/invitations?clinicId=${clinicId}`)
      ]);
      const docsData = await docsRes.json();
      const invData = await invRes.json();
      setDoctors(docsData);
      setInvitations(invData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (slug?: string) => {
    const targetSlug = slug || searchQuery;
    if (!targetSlug) return;
    setInviting(true);
    const sanitizedSlug = targetSlug.trim().toLowerCase();
    try {
      const res = await fetch(`/api/clinic/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, doctorSlug: sanitizedSlug })
      });
      if (res.ok) {
        setSearchQuery('');
        setShowSuggestions(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!confirm(t('clinic.confirmRemoveDoctor') || 'Remove this doctor from clinic?')) return;
    try {
      const res = await fetch(`/api/clinic/doctors/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, doctorId })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-slate-800">
        <SectionHeader title={t('clinic.inviteDoctors')} />

        <div className="mt-4 space-y-4">
          <div className="relative" ref={searchRef}>
             <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                    placeholder={t('clinic.searchDoctorPlaceholder') || "Search by name or specialty..."}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Spinner />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleInvite()}
                  disabled={inviting || !searchQuery}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black transition disabled:opacity-50"
                >
                  {inviting ? <Spinner /> : t('clinic.sendInvite')}
                </button>
             </div>

             <AnimatePresence>
               {showSuggestions && suggestions.length > 0 && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden max-h-[320px] overflow-y-auto"
                 >
                    {suggestions.map(doc => (
                      <button
                        key={doc._id}
                        onClick={() => {
                          handleInvite(doc.slug);
                        }}
                        className="w-full text-left p-4 hover:bg-blue-50 transition flex items-center gap-4 border-b border-slate-50 last:border-0"
                      >
                         <img src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} className="w-10 h-10 rounded-xl object-cover" alt="" />
                         <div>
                            <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                            <p className="text-[10px] text-blue-600 font-black uppercase">{doc.specialty?.[lang] || doc.specialty?.ru}</p>
                         </div>
                         <div className="ml-auto flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                           ⭐ {doc.reviewAvg || 0}
                         </div>
                      </button>
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             {t('clinic.inviteHint') || "You can also invite by direct slug or email"}
          </div>
        </div>
      </div>

      {/* Linked Doctors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('clinic.doctors')} ({doctors.length})</h3>
        </div>

        {doctors.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-10 text-center text-slate-400 border border-slate-100 shadow-sm italic">
            {t('clinic.noDoctorsLinked') || "No doctors linked yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <motion.div
                layout
                key={doc._id}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 text-slate-800 relative group"
              >
                 <div className="flex items-center gap-4">
                    <img src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt={doc.name} />
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-slate-900 truncate">{doc.name}</p>
                       <p className="text-[10px] text-blue-600 font-black uppercase truncate">{(doc.specialty as any)?.[lang] || (doc.specialty as any)?.ru}</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          ⭐ {doc.reviewAvg || 0}
                       </div>
                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                       <div className="text-[10px] text-slate-400 font-bold">
                          {doc.reviewCount || 0} {t('clinic.reviewsCount')}
                       </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDoctor(doc._id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title={t('clinic.removeDoctor')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                 </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-4">{t('clinic.invitations')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map(inv => (
              <div key={inv._id} className="bg-slate-100/50 p-6 rounded-3xl border border-white flex items-center gap-4 opacity-70 text-slate-800">
                 <div className="flex-1">
                    <p className="font-bold text-slate-700">{inv.doctorId.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{t('clinic.pendingInvitation')}</p>
                 </div>
                 <span className="text-xs text-slate-400 font-bold">{new Date(inv.sentAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
