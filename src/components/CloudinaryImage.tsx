'use client';

import Image, { type ImageLoaderProps, type ImageProps } from 'next/image';
import { cloudinaryImageUrl, isCloudinaryUpload } from '@/lib/cloudinary-image';

// Defined at module level: a function cannot be passed as a prop from a server component, and a fresh function on
// every render would make next/image rebuild its srcset each time.
const cloudinaryLoader = ({ src, width }: ImageLoaderProps) => cloudinaryImageUrl(src, width);

/**
 * `next/image` that fetches Cloudinary pictures from Cloudinary directly, at the width the browser needs (see
 * lib/cloudinary-image.ts), instead of going through Vercel's image optimizer. Any other source (a local file,
 * Unsplash, a Google avatar) is handled exactly as before. Same props as next/image, minus `loader`.
 */
export default function CloudinaryImage({ alt, ...props }: Omit<ImageProps, 'loader'>) {
  return isCloudinaryUpload(props.src) ? (
    <Image alt={alt} {...props} loader={cloudinaryLoader} />
  ) : (
    <Image alt={alt} {...props} />
  );
}
