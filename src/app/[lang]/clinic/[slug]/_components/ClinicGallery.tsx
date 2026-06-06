import Image from 'next/image';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function ClinicGallery({ photos }: { photos: string[] }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-20 text-center text-slate-400 border border-slate-100 shadow-sm">
        <p className="text-5xl mb-4">📸</p>
        <p className="font-bold uppercase tracking-widest text-xs">No photos in gallery yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, i) => (
        <div key={i} className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group cursor-zoom-in">
          <Image
            src={getOptimizedCloudinaryUrl(photo, { width: 600, height: 600, crop: 'fill' })}
            alt={`Gallery photo ${i + 1}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      ))}
    </div>
  );
}
