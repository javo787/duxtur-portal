export interface DirectUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey?: string;
  cloudName?: string;
  folder: string;
  format?: string;
  videoCodec?: string;
}

/**
 * Загружает файл напрямую в Cloudinary из браузера (минуя наш сервер).
 * Использует XMLHttpRequest вместо fetch, чтобы иметь возможность
 * показать прогресс загрузки — важно для видео, которое может грузиться
 * не мгновенно на мобильном интернете.
 */
export function uploadFileDirectToCloudinary(
  file: File,
  sig: UploadSignature,
  resourceType: 'image' | 'video',
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  return new Promise((resolve) => {
    if (!sig.apiKey || !sig.cloudName) {
      resolve({ success: false, error: 'Cloudinary не настроен на сервере (нет CLOUDINARY_* переменных)' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);
    if (sig.format) formData.append('format', sig.format);
    if (sig.videoCodec) formData.append('video_codec', sig.videoCodec);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({ success: true, url: data.secure_url });
        } else {
          resolve({ success: false, error: data?.error?.message || `Cloudinary вернул ошибку (${xhr.status})` });
        }
      } catch {
        resolve({ success: false, error: 'Не удалось обработать ответ Cloudinary' });
      }
    };

    xhr.onerror = () => resolve({ success: false, error: 'Ошибка сети во время загрузки' });
    xhr.ontimeout = () => resolve({ success: false, error: 'Превышено время ожидания загрузки' });
    xhr.timeout = 120_000; // 2 минуты — достаточно даже для медленного мобильного интернета

    xhr.send(formData);
  });
}
