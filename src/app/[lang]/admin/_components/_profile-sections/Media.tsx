'use client';
import { useState } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { SectionHeader, Spinner } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function Media({ profile, setProfile }: Props) {
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const gallery: string[] = profile.gallery || [];

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          const res = await uploadImageToCloudinary(fd, 'doctors');
          return res.success ? res.url : null;
        }),
      );
      const successful = uploads.filter((u): u is string => !!u);
      setProfile((p: any) => ({ ...p, gallery: [...(p.gallery || []), ...successful] }));
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadImageToCloudinary(fd, 'doctors');
      if (res.success) setProfile((p: any) => ({ ...p, videoIntro: res.url }));
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-7 space-y-7">
      <SectionHeader
        title="Фото и видео"
        subtitle="Пациенты в 2 раза чаще записываются к врачам с фото кабинета и видео-визиткой"
        accent
      />

      {/* Галерея */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
          📸 Фото рабочего места
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {gallery.map((photo, index) => (
            <div key={index} className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden group">
              <img
                src={getOptimizedCloudinaryUrl(photo, { width: 300, height: 300, crop: 'fill' })}
                alt={`Фото ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  const next = [...gallery];
                  next.splice(index, 1);
                  setProfile((p: any) => ({ ...p, gallery: next }));
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
            {uploadingGallery ? (
              <Spinner size="md" />
            ) : (
              <>
                <span className="text-2xl">➕</span>
                <span className="text-[9px] font-black uppercase text-slate-400 text-center px-1">Добавить</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          Кабинет, оборудование, приёмная — до 8 фото. Пациенту важно заранее увидеть, куда он идёт.
        </p>
      </div>

      {/* Видео-визитка */}
      <div className="border-t border-slate-100 pt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
          🎬 Видео-визитка (30–60 сек)
        </p>
        {profile.videoIntro ? (
          <div className="relative rounded-2xl overflow-hidden bg-black max-w-sm">
            <video src={profile.videoIntro} controls className="w-full aspect-video" />
            <button
              onClick={() => setProfile((p: any) => ({ ...p, videoIntro: '' }))}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 max-w-sm aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
            {uploadingVideo ? (
              <Spinner size="md" />
            ) : (
              <>
                <span className="text-3xl">🎥</span>
                <span className="text-xs font-bold text-slate-500">Загрузить видео (до 30 МБ)</span>
              </>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          Короткое видео «от первого лица»: кто вы, чем помогаете, как проходит приём. Снимите на телефон — этого достаточно.
        </p>
      </div>
    </div>
  );
}
