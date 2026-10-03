import type { EccLevel, PhotoStyle, QrStyle } from '../types';
import { contrastRatio, hexToRgb } from './colour';
import type { Rgb } from './colour';

/** Defaults for a newly added photo: the halftone "Dots" Photo QR. */
export const DEFAULT_PHOTO: Omit<PhotoStyle, 'src' | 'ref'> = {
  mode: 'dots',
  strength: 60,
  contrast: 40,
  dotScale: 42,
  dotShape: 'circle',
  halo: 60,
  eyeOpacity: 90,
  brightness: 0,
  photoContrast: 0,
  saturation: 100,
  readability: 35,
  plate: true,
  border: '#ffffff',
  detail: 0,
};

/** A photo hides data, so error correction is raised to at least Q while one is set. */
export function atLeastQ(ecc: EccLevel): EccLevel {
  return ecc === 'L' || ecc === 'M' ? 'Q' : ecc;
}

/** The style actually rendered: identical to `style` unless a photo forces ECC up. */
export function effectiveStyle(style: QrStyle): QrStyle {
  if (!style.photo) return style;
  const ecc = atLeastQ(style.ecc);
  return ecc === style.ecc ? style : { ...style, ecc };
}

/** Rebuilds trusted photo settings from unknown JSON (history), without the image itself. */
export function parsePhoto(raw: unknown): PhotoStyle | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const num = (key: keyof PhotoStyle, min: number, max: number) => {
    const v = r[key];
    return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : (DEFAULT_PHOTO[key as keyof typeof DEFAULT_PHOTO] as number);
  };
  const mode = r.mode === 'tint' || r.mode === 'underlay' || r.mode === 'dots' ? r.mode : DEFAULT_PHOTO.mode;
  const dotShape = r.dotShape === 'rounded' || r.dotShape === 'square' || r.dotShape === 'circle' ? r.dotShape : DEFAULT_PHOTO.dotShape;
  return {
    src: '',
    ref: typeof r.ref === 'string' ? r.ref : null,
    mode,
    strength: num('strength', 0, 100),
    contrast: num('contrast', 0, 100),
    dotScale: num('dotScale', 25, 80),
    dotShape,
    halo: num('halo', 0, 100),
    eyeOpacity: num('eyeOpacity', 50, 100),
    brightness: num('brightness', -50, 50),
    photoContrast: num('photoContrast', -50, 50),
    saturation: num('saturation', 0, 200),
    readability: num('readability', 0, 100),
    plate: typeof r.plate === 'boolean' ? r.plate : DEFAULT_PHOTO.plate,
    border: typeof r.border === 'string' && hexToRgb(r.border) ? r.border : DEFAULT_PHOTO.border,
    detail: num('detail', 0, 12),
  };
}

// ---- colour helpers shared by the photo renderer ---------------------------

/** Tinted mode: share of the photo visible in light areas. */
export function lightPhotoShare(photo: PhotoStyle): number {
  return (photo.strength / 100) * 0.55 * (1 - (photo.contrast / 100) * 0.5);
}

/** Tinted mode: target contrast between dark modules and their surroundings. */
export function targetContrast(photo: PhotoStyle): number {
  return 4.5 + (photo.contrast / 100) * 5.5;
}

/** Underlay mode: photo opacity, and the opacity of plates under light modules. */
export function underlayOpacity(photo: PhotoStyle): number {
  return photo.strength / 100;
}
export function plateOpacity(photo: PhotoStyle): number {
  return 0.3 + (photo.contrast / 100) * 0.6;
}

export const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
export const rgbOf = (hex: string): Rgb => hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
/** Relative luminance 0–1 of an sRGB colour (fast approximation, good enough for tone decisions). */
export const luma = ({ r, g, b }: Rgb) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Darkens `colour` until it reaches `ratio` against every reference colour. */
export function darkenToContrast(colour: Rgb, references: Rgb[], ratio: number): Rgb {
  let current = colour;
  for (let step = 0; step < 48; step += 1) {
    const hex = toHex(current);
    if (references.every((ref) => contrastRatio(hex, toHex(ref)) >= ratio)) return current;
    current = { r: current.r * 0.9, g: current.g * 0.9, b: current.b * 0.9 };
  }
  return { r: 0, g: 0, b: 0 };
}
