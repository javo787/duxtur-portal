/**
 * Cloudinary URLs for next/image, built for the width the browser asked for (see components/CloudinaryImage.tsx).
 *
 * The default loader sends every Cloudinary picture through Vercel's optimizer: Vercel downloads the (already resized)
 * file from Cloudinary and encodes it again. Cloudinary does the same job itself (f_auto: AVIF/WebP by Accept header,
 * q_auto, any width) and its CDN serves the result, so the browser can go to it directly.
 */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

// One Cloudinary transformation segment: comma-separated "<1-3 letters>_<value>" pairs (f_auto,q_auto,w_900).
// A version (v1712345678) or a folder name is not one.
const TRANSFORMATION = /^[a-z]{1,3}_[^,/]+(,[a-z]{1,3}_[^,/]+)*$/;

// next/image asks for up to 3840 px for a full-width image on a 4K screen; no picture on this site needs more than this
const MAX_WIDTH = 2048;

export function isCloudinaryUpload(src: unknown): src is string {
  return typeof src === 'string' && CLOUDINARY_UPLOAD.test(src);
}

/**
 * `src` is a Cloudinary upload URL, with or without the transformation that lib/utils.ts getOptimizedCloudinaryUrl()
 * puts in (f_auto,q_auto,w_900,h_600,c_fill). The crop and the aspect ratio that call chose are kept; only the size
 * is replaced by the requested `width`. Anything that is not a Cloudinary upload URL is returned unchanged.
 */
export function cloudinaryImageUrl(src: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(src);
  if (!match) return src;
  const [, head, rest] = match;

  const slash = rest.indexOf('/');
  const first = slash === -1 ? '' : rest.slice(0, slash);
  const hasTransformation = TRANSFORMATION.test(first);
  const tokens = hasTransformation ? first.split(',') : [];
  const tail = hasTransformation ? rest.slice(slash + 1) : rest;

  const param = (key: string) => tokens.find(t => t.startsWith(`${key}_`))?.slice(key.length + 1);
  const baseWidth = Number(param('w'));
  const baseHeight = Number(param('h'));
  const crop = param('c');

  const w = Math.min(Math.max(Math.round(width), 1), MAX_WIDTH);
  const out = [`f_${param('f') ?? 'auto'}`, `q_${param('q') ?? 'auto'}`];
  if (baseWidth > 0 && baseHeight > 0) {
    out.push(`w_${w}`, `h_${Math.max(Math.round((w * baseHeight) / baseWidth), 1)}`, `c_${crop ?? 'fill'}`);
  } else {
    // No aspect ratio chosen: scale down, never up
    out.push(`w_${w}`, 'c_limit');
  }
  // Whatever else the caller asked for (g_face, e_...) stays
  out.push(...tokens.filter(t => !/^(f|q|w|h|c)_/.test(t)));

  return `${head}${out.join(',')}/${tail}`;
}
