import { v2 as cloudinary } from 'cloudinary';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ImageRole = 'logo' | 'cover' | 'photo';

/** Deterministic id: re-uploading the same role for the same entity replaces the old image. */
export function buildPublicId(kind: 'clinics' | 'doctors', slug: string, role: ImageRole): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!safe) throw new Error('Cannot build a Cloudinary public_id without a slug');
  return `duxtur/${kind}/${safe}/${role}`;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(file: { size: number; type: string }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Допустимые форматы изображения: JPG, PNG, WebP';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Изображение больше 5 МБ';
  if (file.size === 0) return 'Пустой файл изображения';
  return null;
}

export function isCloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** Uploads to Cloudinary and returns the secure (versioned) URL. */
export async function uploadImage(file: File, publicId: string): Promise<string> {
  if (!isCloudinaryConfigured()) throw new Error('Cloudinary не настроен (CLOUDINARY_* переменные окружения)');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: publicId, overwrite: true, invalidate: true, resource_type: 'image' },
        (err, res) => (err || !res ? reject(err ?? new Error('Empty Cloudinary response')) : resolve(res.secure_url))
      )
      .end(buffer);
  });
}
