'use server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function uploadImageToCloudinary(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Файл не выбран' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Недопустимый формат файла' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'Файл слишком большой' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'clinics' },
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
