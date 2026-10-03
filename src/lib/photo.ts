import type { EccLevel, PhotoStyle, QrStyle } from '../types';
import { contrastRatio, hexToRgb } from './colour';
import type { Rgb } from './colour';

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
/** Photos are downscaled to this edge on upload, which keeps rendering fast. */
export const MAX_PHOTO_EDGE = 1024;

export const DEFAULT_PHOTO: Omit<PhotoStyle, 'src'> = { mode: 'tint', strength: 60, contrast: 40 };

export class PhotoError extends Error {}

/** A photo hides data modules, so error correction is raised to at least Q while one is set. */
export function atLeastQ(ecc: EccLevel): EccLevel {
  return ecc === 'L' || ecc === 'M' ? 'Q' : ecc;
}

/** The style actually rendered: identical to `style` unless a photo forces ECC up. */
export function effectiveStyle(style: QrStyle): QrStyle {
  if (!style.photo) return style;
  const ecc = atLeastQ(style.ecc);
  return ecc === style.ecc ? style : { ...style, ecc };
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new PhotoError('That photo could not be read. Try another file.'));
    image.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new PhotoError('That photo could not be read.')));
    reader.onerror = () => reject(new PhotoError('That photo could not be read. Try another file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and downscales an uploaded photo, entirely in the browser.
 * Returns a JPEG data URL no larger than MAX_PHOTO_EDGE on its long side.
 */
export async function readPhoto(file: File): Promise<string> {
  if (!PHOTO_TYPES.includes(file.type)) throw new PhotoError('Use a PNG, JPG or WebP photo.');
  if (file.size > MAX_PHOTO_BYTES) {
    throw new PhotoError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep photos under ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`);
  }
  const image = await decodeImage(await readAsDataUrl(file));
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('This browser did not provide a 2D canvas context.');
  // Flatten transparency onto white so the photo behaves the same in every format.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export interface PreparedPhoto {
  /** The photo cover-fitted to a square of the data area's size. */
  canvas: HTMLCanvasElement;
  pixels: Uint8ClampedArray;
  size: number;
}

const prepared = new Map<string, Promise<PreparedPhoto>>();

/** Cover-fits the photo into a `size` square once per (photo, size) and caches it. */
export function preparePhoto(src: string, size: number): Promise<PreparedPhoto> {
  const key = `${size}|${src}`;
  const cached = prepared.get(key);
  if (cached) return cached;
  const job = decodeImage(src).then((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new PhotoError('This browser did not provide a 2D canvas context.');
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    return { canvas, pixels: ctx.getImageData(0, 0, size, size).data, size };
  });
  prepared.set(key, job);
  // Keep the cache small: preview, thumbnail and a download size are plenty.
  if (prepared.size > 6) prepared.delete(prepared.keys().next().value as string);
  job.catch(() => prepared.delete(key));
  return job;
}

/** Share of the photo visible in light areas (tinted mode): stays faint so light modules read as light. */
export function lightPhotoShare(photo: PhotoStyle): number {
  return (photo.strength / 100) * 0.55 * (1 - (photo.contrast / 100) * 0.5);
}

/** Target contrast between dark modules and their surroundings: 4.5:1 at minimum. */
export function targetContrast(photo: PhotoStyle): number {
  return 4.5 + (photo.contrast / 100) * 5.5;
}

/** Underlay: photo opacity behind the code, and the opacity of the plates under light modules. */
export function underlayOpacity(photo: PhotoStyle): number {
  return photo.strength / 100;
}
export function plateOpacity(photo: PhotoStyle): number {
  return 0.3 + (photo.contrast / 100) * 0.6;
}

export const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });

/**
 * Darkens `colour` until it reaches `ratio` against every reference colour.
 * Returns black in the worst case, which always passes against a light ground.
 */
export function darkenToContrast(colour: Rgb, references: Rgb[], ratio: number): Rgb {
  let current = colour;
  for (let step = 0; step < 48; step += 1) {
    const hex = toHex(current);
    if (references.every((ref) => contrastRatio(hex, toHex(ref)) >= ratio)) return current;
    current = { r: current.r * 0.9, g: current.g * 0.9, b: current.b * 0.9 };
  }
  return { r: 0, g: 0, b: 0 };
}

export const rgbOf = (hex: string): Rgb => hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
