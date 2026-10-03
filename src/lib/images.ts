/**
 * Shared upload pipeline for photos and logos: validate, decode (honouring
 * EXIF orientation), downscale once, and keep the result as a blob. Images are
 * processed locally and never leave the tab.
 */
export class ImageError extends Error {}

export interface ImageRules {
  label: 'photo' | 'logo';
  maxBytes: number;
  /** Raster formats accepted, plus SVG for logos. */
  types: string[];
  svgMaxBytes?: number;
  /** Long-edge cap after downscaling. */
  maxEdge: number;
  /** Output format: JPEG for photos, PNG for logos (keeps transparency). */
  output: 'image/jpeg' | 'image/png';
}

const RASTER = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

export const PHOTO_RULES: ImageRules = { label: 'photo', maxBytes: 25 * 1024 * 1024, types: RASTER, maxEdge: 2048, output: 'image/jpeg' };
export const LOGO_RULES: ImageRules = {
  label: 'logo',
  maxBytes: 10 * 1024 * 1024,
  types: [...RASTER, 'image/svg+xml'],
  svgMaxBytes: 2 * 1024 * 1024,
  maxEdge: 1024,
  output: 'image/png',
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB`;

function typeError(file: File, rules: ImageRules): string {
  const name = file.name.toLowerCase();
  if (file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/.test(name)) {
    return 'HEIC photos are not supported in browsers yet. Export it as JPG or PNG first.';
  }
  return rules.label === 'logo' ? 'Use a PNG, JPG, WebP, GIF, AVIF or SVG image.' : 'Use a PNG, JPG, WebP, GIF or AVIF photo.';
}

export function validateImage(file: File, rules: ImageRules): void {
  if (!rules.types.includes(file.type)) throw new ImageError(typeError(file, rules));
  const cap = file.type === 'image/svg+xml' ? rules.svgMaxBytes ?? rules.maxBytes : rules.maxBytes;
  if (file.size > cap) throw new ImageError(`That ${rules.label} is ${mb(file.size)}. The limit is ${mb(cap)}.`);
}

/** SVG is rasterised through an <img> (scripts never run) and never injected into the page. */
function decodeSvg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('That SVG could not be read. Try exporting it again or use a PNG.'));
    };
    image.src = url;
  });
}

/** Decodes, orients, downscales and re-encodes an upload. Returns a blob ready to store. */
export async function processImage(file: File, rules: ImageRules): Promise<Blob> {
  validateImage(file, rules);
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  try {
    if (file.type === 'image/svg+xml') {
      const image = await decodeSvg(file);
      source = image;
      width = image.naturalWidth || 512;
      height = image.naturalHeight || 512;
    } else {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    }
  } catch (cause) {
    if (cause instanceof ImageError) throw cause;
    throw new ImageError(`That ${rules.label} looks corrupt or unreadable. Try another file.`);
  }
  if (!width || !height) throw new ImageError(`That ${rules.label} looks corrupt or unreadable. Try another file.`);

  const scale = Math.min(1, rules.maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('This browser did not provide a 2D canvas context.');
  if (rules.output === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source && typeof source.close === 'function') source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, rules.output, 0.9));
  if (!blob) throw new ImageError(`That ${rules.label} could not be processed in this browser.`);
  return blob;
}
