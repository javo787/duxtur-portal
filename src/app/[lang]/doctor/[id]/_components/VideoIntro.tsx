'use client';
import { useState, useRef } from 'react';
import { useT } from '@/i18n';
import { useParams } from 'next/navigation';

export default function VideoIntro({ videoUrl, doctorName }: { videoUrl: string; doctorName?: string }) {
  const { lang } = useParams() as { lang: string };
  const { t } = useT(lang);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl) return null;

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-lg group max-w-md">
      <video
        ref={videoRef}
        src={videoUrl}
        controls={playing}
        playsInline
        className="w-full aspect-video object-cover"
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={() => {
            setPlaying(true);
            videoRef.current?.play();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors"
        >
          <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 4.2c0-.9 1-1.5 1.8-1l9 5.8c.7.5.7 1.5 0 2l-9 5.8c-.8.5-1.8-.1-1.8-1V4.2z" />
            </svg>
          </span>
          <span className="absolute bottom-4 left-4 right-4 text-white text-sm font-bold text-left drop-shadow">
            {t('doctor.watchVideo')}
          </span>
        </button>
      )}
    </div>
  );
}
