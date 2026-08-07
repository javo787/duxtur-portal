'use server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * @param formData  форма с полем "file"
 * @param folder    папка в Cloudinary (по умолчанию 'clinics' — для обратной совместимости
 *                   с уже существующими вызовами: аватары врачей, фото клиник и т.д.)
 */
export async function uploadImageToCloudinary(formData: FormData, folder: string = 'clinics') {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Файл не выбран' };
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    if (!isVideo && !isImage) {
      return { success: false, error: 'Недопустимый формат файла' };
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return {
        success: false,
        error: isVideo ? 'Видео слишком большое (макс. 30 МБ)' : 'Файл слишком большой',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: isVideo ? 'video' : 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );
      uploadStream.end(buffer);
    });

    return { success: true, url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return { success: false, error: error.message };
  }
}
