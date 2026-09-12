'use client';

import { motion } from 'framer-motion';
import { CLINIC_TYPES } from '@/lib/clinic-constants';

// ─── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <motion.svg
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className={`h-5 w-5 ${dark ? 'text-slate-900' : 'text-white'}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </motion.svg>
);

// ─── Live preview card ───────────────────────────────────────────────────────
export function ClinicPreviewCard({
  name, type, city, logo, t
}: { name: string; type: string; city: string; logo: string; t: (key: string) => string }) {
  const typeObj = CLINIC_TYPES.find((tp) => tp.id === type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[32px] overflow-hidden border border-white/40 bg-white/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)]"
    >
      {/* mini cover */}
      <div className="h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />

      {/* logo */}
      <motion.div
        layoutId="clinic-logo"
        className="absolute top-10 left-6 w-20 h-20 rounded-[24px] border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center text-4xl"
      >
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{typeObj?.emoji || '🏥'}</span>
        )}
      </motion.div>

      {/* verified badge */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full flex items-center gap-1.5 shadow-xl shadow-blue-500/30"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {t('common.verified')}
      </motion.div>

      <div className="pt-12 pb-8 px-8">
        <motion.p
          layout
          className="font-black text-slate-900 text-xl truncate leading-tight tracking-tight"
        >
          {name || t('clinic.clinicName')}
        </motion.p>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-[12px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
            {typeObj ? t(`clinic.type_${typeObj.id}`) : t('clinic.type_clinic')}
          </span>
          {city && (
            <span className="text-[12px] text-slate-500 font-bold flex items-center gap-1.5">
              <span className="text-base">📍</span> {city}
            </span>
          )}
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-amber-500">
          {'★★★★★'.split('').map((s, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 * i, type: "spring" }}
              className="text-lg"
            >
              {s}
            </motion.span>
          ))}
          <span className="text-slate-400 text-[12px] ml-2 font-black uppercase tracking-widest">{t('clinic.newClinic')}</span>
        </div>
      </div>
    </motion.div>
  );
}
