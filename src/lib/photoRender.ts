/**
 * Photo styles, loaded on demand by render.ts only when a photo is set.
 *
 * Every photo style is described once as a list of draw operations on the
 * shared geometry from render.ts. The canvas executes the list and the SVG
 * serialises the same list, so the preview, the PNG and the SVG match.
 *
 * "Dots" is a halftone Photo QR (after Chu et al., "Halftone QR Codes",
 * SIGGRAPH Asia 2013): decoders sample each module near its centre, so a small
 * centred dot carries the module's value and the photo shows around it.
 * Finder, timing and alignment patterns are never replaced by dots.
 */
import QRCode from 'qrcode';
import type { BitMatrix } from 'qrcode';
import type { PhotoStyle, QrStyle } from '../types';
import type { Rgb } from './colour';
import { QrRenderError, buildMatrix, geometry, loadImage, renderEcc } from './render';
import { darkenToContrast, lightPhotoShare, luma, mix, plateOpacity, rgbOf, targetContrast, toHex, underlayOpacity } from './photo';

export type PhotoOp =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string; opacity?: number; radius?: number }
  | { kind: 'ring'; x: number; y: number; w: number; h: number; stroke: string; width: number; radius: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string; opacity?: number }
  | { kind: 'image'; source: HTMLCanvasElement; x: number; y: number; w: number; h: number; opacity?: number; clipRadius?: number };

// ---------------------------------------------------------------- photo prep --

interface Prepared {
  canvas: HTMLCanvasElement;
  pixels: Uint8ClampedArray;
  size: number;
}

const cache = new Map<string, Promise<Prepared>>();

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Cover-fits the photo into a `size` square and applies brightness, contrast,
 * saturation and readability (tone compression toward mid-grey). Cached per
 * photo, size and settings so slider moves only redo the dots.
 */
function preparePhoto(photo: PhotoStyle, size: number): Promise<Prepared> {
  const key = [photo.src, size, photo.brightness, photo.photoContrast, photo.saturation, photo.readability].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const job = loadImage(photo.src).then((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new QrRenderError('This browser did not provide a 2D canvas context.');
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);

    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    const brightness = photo.brightness * 2.55;
    const contrast = 1 + (photo.photoContrast / 50) * 0.8;
    const saturation = photo.saturation / 100;
    const compress = 1 - (photo.readability / 100) * 0.65;
    for (let i = 0; i < d.length; i += 4) {
      let r = (d[i] + brightness - 128) * contrast + 128;
      let g = (d[i + 1] + brightness - 128) * contrast + 128;
      let b = (d[i + 2] + brightness - 128) * contrast + 128;
      const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = grey + (r - grey) * saturation;
      g = grey + (g - grey) * saturation;
      b = grey + (b - grey) * saturation;
      d[i] = clamp255(128 + (r - 128) * compress);
      d[i + 1] = clamp255(128 + (g - 128) * compress);
      d[i + 2] = clamp255(128 + (b - 128) * compress);
    }
    ctx.putImageData(img, 0, 0);
    return { canvas, pixels: d, size };
  });
  cache.set(key, job);
  if (cache.size > 8) cache.delete(cache.keys().next().value as string);
  job.catch(() => cache.delete(key));
  return job;
}

// -------------------------------------------------------------------- matrix --

/**
 * The module matrix for a photo style: error correction of at least Q, and an
 * optional higher version ("Detail") for more, smaller modules.
 */
function photoMatrix(text: string, style: QrStyle, photo: PhotoStyle): BitMatrix {
  const ecc = renderEcc(style);
  let base: ReturnType<typeof QRCode.create>;
  try {
    base = QRCode.create(text, { errorCorrectionLevel: ecc });
  } catch {
    return buildMatrix(text, ecc); // throws the friendly "too long" error
  }
  const version = Math.min(40, base.version + photo.detail);
  return version === base.version ? base.modules : QRCode.create(text, { errorCorrectionLevel: ecc, version }).modules;
}

// ---------------------------------------------------------------------- scene --

/** Smallest dot diameter in output pixels; below this decoders stop resolving dots. */
export const MIN_DOT_PX = 3;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function isFinderZone(row: number, col: number, size: number): boolean {
  const near = (v: number) => v <= 7;
  const far = (v: number) => v >= size - 8;
  return (near(row) && near(col)) || (near(row) && far(col)) || (far(row) && near(col));
}

/** Builds the draw operations for the current photo style. */
export async function photoScene(text: string, style: QrStyle): Promise<PhotoOp[]> {
  const photo = style.photo;
  if (!photo || !photo.src) throw new QrRenderError('The photo is not available.');
  if (photo.mode === 'dots') return dotsScene(text, style, photo);
  return blendScene(text, style, photo);
}

async function dotsScene(text: string, style: QrStyle, photo: PhotoStyle): Promise<PhotoOp[]> {
  const size = style.size;
  const matrix = photoMatrix(text, style, photo);
  const moduleSize = size / (matrix.size + style.margin * 2);
  const border = photo.plate ? Math.max(2, Math.round(moduleSize * 0.6)) : 0;
  const radius = photo.plate ? Math.round(size * 0.05) : 0;
  const inner = size - border * 2;
  const prepared = await preparePhoto(photo, inner);

  const sample = (x: number, y: number): Rgb => {
    const px = Math.min(inner - 1, Math.max(0, Math.floor(x - border)));
    const py = Math.min(inner - 1, Math.max(0, Math.floor(y - border)));
    const i = (py * inner + px) * 4;
    return { r: prepared.pixels[i], g: prepared.pixels[i + 1], b: prepared.pixels[i + 2] };
  };

  const { edges, offset } = geometry(matrix, style);
  const n = matrix.size;
  const dark = style.foreground;
  const light = style.background;
  const ops: PhotoOp[] = [
    { kind: 'rect', x: 0, y: 0, w: size, h: size, fill: photo.plate ? photo.border : light, radius },
    { kind: 'image', source: prepared.canvas, x: border, y: border, w: inner, h: inner, clipRadius: Math.max(0, radius - border) },
  ];

  const cell = (i: number) => edges[i + offset];
  const span = (i: number) => edges[i + offset + 1] - edges[i + offset];

  // Eyes: a light translucent plate with a dark rounded ring and core.
  for (const [r0, c0] of [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]) {
    const x = cell(c0);
    const y = cell(r0);
    const m = span(c0);
    const w = cell(c0 + 7) - x;
    ops.push({ kind: 'rect', x: x - m, y: y - m, w: w + 2 * m, h: w + 2 * m, fill: light, opacity: photo.eyeOpacity / 100, radius: m * 1.8 });
    ops.push({ kind: 'ring', x: x + m / 2, y: y + m / 2, w: w - m, h: w - m, stroke: dark, width: m, radius: m * 1.3 });
    ops.push({ kind: 'rect', x: cell(c0 + 2), y: cell(r0 + 2), w: cell(c0 + 5) - cell(c0 + 2), h: cell(r0 + 5) - cell(r0 + 2), fill: dark, radius: m * 0.7 });
  }

  const darkRgb = rgbOf(dark);
  const lightRgb = rgbOf(light);
  const scale = photo.dotScale / 100;
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      if (isFinderZone(row, col, n)) continue;
      const on = Boolean(matrix.get(row, col));
      const x = cell(col);
      const y = cell(row);
      const w = span(col);
      const h = span(row);
      // Timing, alignment, format and version modules stay full-size and solid.
      if (matrix.isReserved(row, col)) {
        ops.push({ kind: 'rect', x, y, w, h, fill: on ? dark : light });
        continue;
      }
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(Math.min(w, h) * 0.8, Math.max(Math.min(w, h) * scale, MIN_DOT_PX)) / 2;
      const tone = luma(sample(cx, cy));
      // Halo of the opposite ink, only as strong as the local photo tone needs.
      const need = on ? clamp01((0.62 - tone) / 0.62) : clamp01((tone - 0.38) / 0.62);
      const haloAlpha = (photo.halo / 100) * need;
      if (haloAlpha > 0.02) {
        ops.push({ kind: 'circle', cx, cy, r: Math.min(Math.min(w, h) * 0.42, r * 1.35), fill: toHex(on ? lightRgb : darkRgb), opacity: Number(haloAlpha.toFixed(3)) });
      }
      const ink = on ? dark : light;
      if (photo.dotShape === 'circle') ops.push({ kind: 'circle', cx, cy, r, fill: ink });
      else ops.push({ kind: 'rect', x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: ink, radius: photo.dotShape === 'rounded' ? r * 0.45 : 0 });
    }
  }
  return ops;
}

/** Tinted modules and photo underlay: the photo covers the data area only. */
async function blendScene(text: string, style: QrStyle, photo: PhotoStyle): Promise<PhotoOp[]> {
  const matrix = photoMatrix(text, style, photo);
  const { edges, offset } = geometry(matrix, style);
  const start = edges[offset];
  const span = edges[offset + matrix.size] - start;
  const prepared = await preparePhoto(photo, span);
  const bg = rgbOf(style.background);
  const fg = rgbOf(style.foreground);
  const ops: PhotoOp[] = [{ kind: 'rect', x: 0, y: 0, w: style.size, h: style.size, fill: style.background }];

  const sample = (x: number, y: number): Rgb => {
    const px = Math.min(span - 1, Math.max(0, Math.floor(x - start)));
    const py = Math.min(span - 1, Math.max(0, Math.floor(y - start)));
    const i = (py * span + px) * 4;
    return { r: prepared.pixels[i], g: prepared.pixels[i + 1], b: prepared.pixels[i + 2] };
  };

  const share = lightPhotoShare(photo);
  if (photo.mode === 'tint') {
    const faded = document.createElement('canvas');
    faded.width = span;
    faded.height = span;
    const fctx = faded.getContext('2d');
    if (!fctx) throw new QrRenderError('This browser did not provide a 2D canvas context.');
    fctx.drawImage(prepared.canvas, 0, 0);
    fctx.globalAlpha = 1 - share;
    fctx.fillStyle = style.background;
    fctx.fillRect(0, 0, span, span);
    ops.push({ kind: 'image', source: faded, x: start, y: start, w: span, h: span });
  } else {
    ops.push({ kind: 'image', source: prepared.canvas, x: start, y: start, w: span, h: span, opacity: underlayOpacity(photo) });
  }

  const ratio = targetContrast(photo);
  const plate = plateOpacity(photo);
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      const x = edges[col + offset];
      const y = edges[row + offset];
      const w = edges[col + offset + 1] - x;
      const h = edges[row + offset + 1] - y;
      const on = Boolean(matrix.get(row, col));
      if (matrix.isReserved(row, col)) {
        ops.push({ kind: 'rect', x, y, w, h, fill: on ? style.foreground : style.background });
      } else if (photo.mode === 'tint') {
        if (!on) continue;
        const pixel = sample(x + w / 2, y + h / 2);
        const tinted = mix(fg, pixel, photo.strength / 100);
        const localLight = mix(pixel, bg, 1 - share);
        ops.push({ kind: 'rect', x, y, w, h, fill: toHex(darkenToContrast(tinted, [localLight, bg], ratio)) });
      } else if (on) {
        ops.push({ kind: 'rect', x, y, w, h, fill: style.foreground });
      } else {
        ops.push({ kind: 'rect', x, y, w, h, fill: style.background, opacity: plate });
      }
    }
  }
  return ops;
}

// ------------------------------------------------------------------ executors --

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawOps(ctx: CanvasRenderingContext2D, ops: PhotoOp[]): void {
  for (const op of ops) {
    ctx.globalAlpha = 'opacity' in op && op.opacity !== undefined ? op.opacity : 1;
    if (op.kind === 'rect') {
      ctx.fillStyle = op.fill;
      if (op.radius) {
        roundedPath(ctx, op.x, op.y, op.w, op.h, op.radius);
        ctx.fill();
      } else {
        ctx.fillRect(op.x, op.y, op.w, op.h);
      }
    } else if (op.kind === 'ring') {
      ctx.strokeStyle = op.stroke;
      ctx.lineWidth = op.width;
      roundedPath(ctx, op.x, op.y, op.w, op.h, op.radius);
      ctx.stroke();
    } else if (op.kind === 'circle') {
      ctx.fillStyle = op.fill;
      ctx.beginPath();
      ctx.arc(op.cx, op.cy, op.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      if (op.clipRadius) {
        ctx.save();
        roundedPath(ctx, op.x, op.y, op.w, op.h, op.clipRadius);
        ctx.clip();
        ctx.drawImage(op.source, op.x, op.y, op.w, op.h);
        ctx.restore();
      } else {
        ctx.drawImage(op.source, op.x, op.y, op.w, op.h);
      }
    }
  }
  ctx.globalAlpha = 1;
}

const n2 = (v: number) => Number(v.toFixed(2));

export function svgOps(ops: PhotoOp[]): string[] {
  const out: string[] = [];
  let clipId = 0;
  for (const op of ops) {
    const opacity = 'opacity' in op && op.opacity !== undefined ? ` opacity="${op.opacity}"` : '';
    if (op.kind === 'rect') {
      const rx = op.radius ? ` rx="${n2(op.radius)}"` : '';
      out.push(`<rect x="${n2(op.x)}" y="${n2(op.y)}" width="${n2(op.w)}" height="${n2(op.h)}"${rx} fill="${op.fill}"${opacity}/>`);
    } else if (op.kind === 'ring') {
      out.push(`<rect x="${n2(op.x)}" y="${n2(op.y)}" width="${n2(op.w)}" height="${n2(op.h)}" rx="${n2(op.radius)}" fill="none" stroke="${op.stroke}" stroke-width="${n2(op.width)}"/>`);
    } else if (op.kind === 'circle') {
      out.push(`<circle cx="${n2(op.cx)}" cy="${n2(op.cy)}" r="${n2(op.r)}" fill="${op.fill}"${opacity}/>`);
    } else {
      // The processed photo is embedded as a data URI, so the SVG is self-contained.
      const href = op.source.toDataURL('image/jpeg', 0.9);
      const attrs = `x="${n2(op.x)}" y="${n2(op.y)}" width="${n2(op.w)}" height="${n2(op.h)}" preserveAspectRatio="none"${opacity}`;
      if (op.clipRadius) {
        clipId += 1;
        out.push(`<clipPath id="qr-photo-${clipId}"><rect ${attrs.replace(/ preserveAspectRatio="none".*/, '')} rx="${n2(op.clipRadius)}"/></clipPath>`);
        out.push(`<image ${attrs} clip-path="url(#qr-photo-${clipId})" href="${href}"/>`);
      } else {
        out.push(`<image ${attrs} href="${href}"/>`);
      }
    }
  }
  return out;
}
