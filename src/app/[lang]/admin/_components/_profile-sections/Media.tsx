'use client';
import { useState } from 'react';
import { getCloudinaryUploadSignature } from '@/app/actions/cloudinary-signature';
import { uploadFileDirectToCloudinary } from '@/lib/cloudinary-direct-upload';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { SectionHeader, Spinner } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 МБ
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 МБ — с запасом для минуты видео в хорошем качестве

export default function Media({ profile, setProfile }: Props) {
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  const gallery: string[] = profile.gallery || [];

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    setGalleryError(null);
    try {
      const tooBig = Array.from(files).find((f) => f.size > MAX_IMAGE_SIZE);
      if (tooBig) {
        setGalleryError(`Файл «${tooBig.name}» больше 15 МБ — сожмите фото и попробуйте снова`);
        return;
      }

      const sig = await getCloudinaryUploadSignature({ folder: 'doctors', resourceType: 'image' });
      const results = await Promise.all(
        Array.from(files).map((file) => uploadFileDirectToCloudinary(file, sig, 'image')),
      );
      const successful = results.filter((r) => r.success).map((r) => r.url as string);
      const failed = results.filter((r) => !r.success);

      if (successful.length > 0) {
        setProfile((p: any) => ({ ...p, gallery: [...(p.gallery || []), ...successful] }));
      }
      if (failed.length > 0) {
        setGalleryError(failed[0].error || 'Не удалось загрузить одно или несколько фото');
      }
    } catch {
      setGalleryError('Не удалось загрузить фото. Проверьте интернет-соединение и попробуйте снова');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (file.size > MAX_VIDEO_SIZE) {
      setVideoError('Видео больше 100 МБ. Сожмите его (например, в приложении для обрезки видео) и загрузите снова');
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);
    setVideoError(null);
    setVideoPlaybackError(false);
    try {
      const sig = await getCloudinaryUploadSignature({ folder: 'doctors', resourceType: 'video' });
      const res = await uploadFileDirectToCloudinary(file, sig, 'video', setVideoProgress);
      if (res.success) {
        setProfile((p: any) => ({ ...p, videoIntro: res.url }));
      } else {
        setVideoError(res.error || 'Не удалось загрузить видео');
      }
    } catch {
      setVideoError('Не удалось загрузить видео. Проверьте интернет-соединение и попробуйте снова');
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
        {galleryError && (
          <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
            <span>⚠️</span> {galleryError}
          </p>
        )}
      </div>

      {/* Видео-визитка */}
      <div className="border-t border-slate-100 pt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
          🎬 Видео-визитка (30–60 сек)
        </p>
        {profile.videoIntro ? (
          <div className="max-w-sm">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <video
                src={profile.videoIntro}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-video"
                onError={() => setVideoPlaybackError(true)}
                onCanPlay={() => setVideoPlaybackError(false)}
              />
              <button
                onClick={() => {
                  setProfile((p: any) => ({ ...p, videoIntro: '' }));
                  setVideoPlaybackError(false);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
              >
                ✕
              </button>
            </div>
            {videoPlaybackError && (
              <p className="text-[11px] text-red-500 font-semibold mt-2 flex items-start gap-1">
                <span>⚠️</span>
                <span>Видео не воспроизводится в браузере. Удалите его и загрузите заново — теперь видео автоматически конвертируется в совместимый формат.</span>
              </p>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 max-w-sm aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
            {uploadingVideo ? (
              <div className="flex flex-col items-center gap-2 w-2/3">
                <Spinner size="md" />
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{videoProgress}%</span>
              </div>
            ) : (
              <>
                <span className="text-3xl">🎥</span>
                <span className="text-xs font-bold text-slate-500">Загрузить видео (до 100 МБ)</span>
              </>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              disabled={uploadingVideo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          Короткое видео «от первого лица»: кто вы, чем помогаете, как проходит приём. Снимите на телефон — этого достаточно. Любой формат (в т.ч. с iPhone) автоматически конвертируется для проигрывания в браузере.
        </p>
        {videoError && (
          <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
            <span>⚠️</span> {videoError}
          </p>
        )}
      </div>
    </div>
  );
}
