'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { Spinner, strField } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
  lang: string;
  isUploading: boolean;
  onAvatarChange: (file: File) => void;
}

export default function AvatarHero({ profile, setProfile, lang, isUploading, onAvatarChange }: Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const specialtyValue = strField(profile.specialty);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400" />
      <div className="p-7">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={profile.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
              alt="Аватар"
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/85 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Spinner size="md" />
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 hover:bg-blue-700
                text-white rounded-lg flex items-center justify-center text-sm shadow-md
                transition-colors duration-150"
              title="Изменить фото"
            >
              ✎
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarChange(file);
              }}
            />
          </div>

          {/* Name / meta */}
          <div className="min-w-0">
            <p className="font-black text-slate-900 text-lg leading-tight truncate">
              {profile.name || 'Имя не указано'}
            </p>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {specialtyValue || 'Специализация не указана'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold
                ${profile.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  profile.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  'bg-red-50 text-red-500 border border-red-100'}`}>
                {profile.status === 'approved' ? '✓ Верифицирован' :
                  profile.status === 'pending' ? '⏳ На проверке' : '✗ Отклонён'}
              </span>
              {profile.slug && (
                <Link
                  href={`/${lang}/doctor/${profile.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold
                    bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  ↗ Публичная страница
                </Link>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-4">
          JPG или PNG до 5MB. Отображается на вашей публичной странице врача.
        </p>
      </div>
    </div>
  );
}
