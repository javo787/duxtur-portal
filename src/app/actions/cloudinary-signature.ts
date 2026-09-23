'use server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SignatureParams {
  folder: string;
  resourceType: 'image' | 'video';
}

/**
 * Подпись для ПРЯМОЙ загрузки файла из браузера в Cloudinary, минуя наш сервер.
 *
 * Почему это важно именно для видео: serverless-функции Vercel (в т.ч. Next.js
 * Server Actions) режут тело запроса на уровне платформы (~4.5 МБ) независимо
 * от bodySizeLimit в next.config.ts — это ограничение самой платформы, не Next.js.
 * Любое видео его превышает. Через сервер здесь идёт только эта подпись
 * (несколько байт), сам файл летит браузер → Cloudinary напрямую.
 */
export async function getCloudinaryUploadSignature({ folder, resourceType }: SignatureParams) {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  if (resourceType === 'video') {
    // Любое видео (в т.ч. .mov/HEVC с iPhone) приводим к универсально
    // совместимому H.264/mp4 прямо на этапе загрузки.
    paramsToSign.format = 'mp4';
    paramsToSign.video_codec = 'h264';
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string,
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    ...(resourceType === 'video' ? { format: 'mp4', videoCodec: 'h264' } : {}),
  };
}
