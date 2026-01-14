'use server';

import { v2 as cloudinary } from 'cloudinary';

// Настраиваем Cloudinary (ключи берутся из .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('Файл не найден');
    }

    // Превращаем файл в буфер данных (понятный для Cloudinary)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем через поток (Stream)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'duxtur-blog' }, // Папка в облаке
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      // Отправляем данные
      uploadStream.end(buffer);
    });

    return { success: true, url: result.secure_url };

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return { success: false, error: error.message };
  }
}
