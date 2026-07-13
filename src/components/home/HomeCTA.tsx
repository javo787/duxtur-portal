import Link from 'next/link';
import FadeIn from '@/components/FadeIn';
import { getT } from '@/i18n';

export default function HomeCTA({ lang, dict }: { lang: string; dict: any }) {
  const t = getT(lang);

  return (
    <section className="relative overflow-hidden py-24 bg-slate-900">
      {/* Enhanced dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #93c5fd 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Floating gradient orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4), transparent 70%)', filter: 'blur(45px)' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-14">
          <FadeIn direction="left" className="flex-1 max-w-lg text-center md:text-left">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-full mb-7 bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {t('home.ctaForDoctors')}
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-5" style={{ textShadow: '0 0 40px rgba(59, 130, 246, 0.15)' }}>
              {dict.for_doctors}
            </h2>
            <p className="text-[15px] leading-relaxed mb-8 text-slate-300">
              {dict.for_doctors_desc}
            </p>
            <ul className="space-y-3.5">
              {[
                t('home.ctaFeature1'),
                t('home.ctaFeature2'),
                t('home.ctaFeature3'),
              ].map((item) => (
                <li key={item} className="cta-check-item flex items-center gap-3 text-[14px] text-slate-300 cursor-default">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn direction="right" delay={150}>
            <div className="rounded-[1.5rem] p-8 text-center w-[300px] border border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-xl shadow-black/20">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <p className="font-display text-[20px] font-semibold text-white mb-1.5 tracking-tight">
                {t('home.ctaVerification')}
              </p>
              <p className="text-[13px] mb-7 text-slate-400">
                {t('home.ctaVerificationDesc')}
              </p>
              <Link
                href={`/${lang}/register`}
                className="flex items-center justify-center gap-2 w-full py-3.5 text-[14px] font-semibold rounded-full text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all btn-spring shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                {dict.btn_join}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
