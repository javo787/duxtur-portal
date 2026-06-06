import Link from 'next/link';
import FadeIn from '@/components/FadeIn';
import { getT } from '@/i18n';

export default function HomeCTA({ lang, dict }: { lang: string; dict: any }) {
  const t = getT(lang);

  return (
    <section className="relative overflow-hidden py-24 bg-slate-900">
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.8 0.01 260) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, oklch(0.62 0.17 75 / 0.5), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, oklch(0.40 0.08 255 / 0.5), transparent 70%)', filter: 'blur(36px)' }} />

      <div className="relative max-w-6xl mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center gap-14">
          <FadeIn direction="left" className="flex-1 max-w-lg text-center md:text-left">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-full mb-7 bg-blue-600/20 text-blue-200">
              {t('home.ctaForDoctors')}
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-5">
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
                <li key={item} className="flex items-center gap-3 text-[14px] text-slate-300">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20">
                    <svg className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn direction="right" delay={150}>
            <div className="rounded-2xl p-8 text-center w-[300px] border border-white/10 bg-slate-800/60 backdrop-blur shadow-xl">
              <div className="w-14 h-14 rounded-xl mx-auto mb-6 flex items-center justify-center bg-blue-600">
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
                className="flex items-center justify-center gap-2 w-full py-3.5 text-[14px] font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors active:scale-95"
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
