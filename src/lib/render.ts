import QRCode from 'qrcode';
import type { BitMatrix } from 'qrcode';
import type { QrStyle } from '../types';
import type { Rgb } from './colour';
import {
  atLeastQ,
  darkenToContrast,
  lightPhotoShare,
  mix,
  plateOpacity,
  preparePhoto,
  rgbOf,
  targetContrast,
  toHex,
  underlayOpacity,
} from './photo';

/** Thrown when the payload or the canvas cannot produce an image. */
export class QrRenderError extends Error {}

/**
 * Builds the module matrix. Throws `QrRenderError` when the payload exceeds
 * what the chosen error-correction level can hold.
 */
export function buildMatrix(text: string, ecc: QrStyle['ecc']): BitMatrix {
  try {
    return QRCode.create(text, { errorCorrectionLevel: ecc }).modules;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new QrRenderError(
      /too big|code length overflow/i.test(reason)
        ? `The content is too long for error correction level ${ecc}. Shorten it or lower the level.`
        : `The content could not be encoded: ${reason}`,
    );
  }
}

/**
 * Pixel boundaries for `count` cells across `pixels` pixels. Rounding the
 * shared edges keeps modules seamless and the image exactly `pixels` wide.
 */
function cellEdges(count: number, pixels: number): number[] {
  const edges = new Array<number>(count + 1);
  for (let i = 0; i <= count; i += 1) {
    edges[i] = Math.round((i * pixels) / count);
  }
  return edges;
}

interface Geometry {
  /** Total cells per side, including the quiet zone. */
  cells: number;
  edges: number[];
  /** Index of the first data module. */
  offset: number;
}

function geometry(matrix: BitMatrix, style: QrStyle): Geometry {
  const cells = matrix.size + style.margin * 2;
  return { cells, edges: cellEdges(cells, style.size), offset: style.margin };
}

const imageCache = new Map<string, HTMLImageElement>();

/** Loads (and caches) a logo data URL as an image element. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete && cached.naturalWidth > 0) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      imageCache.set(src, image);
      resolve(image);
    };
    image.onerror = () => reject(new QrRenderError('The logo image could not be loaded.'));
    image.src = src;
  });
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Geometry of the centred logo plate, shared by the canvas and SVG renderers. */
function logoBox(style: QrStyle): { x: number; y: number; size: number; pad: number } {
  const size = Math.round((style.size * style.logoScale) / 100);
  const pad = Math.max(2, Math.round(size * 0.08));
  return { x: Math.round((style.size - size) / 2), y: Math.round((style.size - size) / 2), size, pad };
}

/** Error correction actually used: a photo style raises it to at least Q. */
const renderEcc = (style: QrStyle) => (style.photo ? atLeastQ(style.ecc) : style.ecc);

/**
 * Photo styles are described once as a list of draw operations on the shared
 * geometry; the canvas executes the list and the SVG serialises the same list,
 * so the preview, the PNG and the SVG cannot diverge.
 */
type PhotoOp =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string; opacity?: number }
  | { kind: 'image'; source: HTMLCanvasElement; x: number; y: number; w: number; h: number; opacity?: number };

async function photoOps(matrix: BitMatrix, style: QrStyle): Promise<PhotoOp[]> {
  const photo = style.photo!;
  const { edges, offset } = geometry(matrix, style);
  const start = edges[offset];
  const span = edges[offset + matrix.size] - start;
  const prepared = await preparePhoto(photo.src, span);
  const bg = rgbOf(style.background);
  const fg = rgbOf(style.foreground);

  // The quiet zone stays plain: the photo only covers the data area.
  const ops: PhotoOp[] = [{ kind: 'rect', x: 0, y: 0, w: style.size, h: style.size, fill: style.background }];

  const sample = (x: number, y: number): Rgb => {
    const px = Math.min(span - 1, Math.max(0, Math.floor(x - start)));
    const py = Math.min(span - 1, Math.max(0, Math.floor(y - start)));
    const i = (py * span + px) * 4;
    return { r: prepared.pixels[i], g: prepared.pixels[i + 1], b: prepared.pixels[i + 2] };
  };

  const share = lightPhotoShare(photo);
  if (photo.mode === 'tint') {
    // Light modules: a faded copy of the photo.
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
      const dark = Boolean(matrix.get(row, col));

      // Finder, timing and alignment patterns (and format/version info) stay solid.
      if (matrix.isReserved(row, col)) {
        ops.push({ kind: 'rect', x, y, w, h, fill: dark ? style.foreground : style.background });
      } else if (photo.mode === 'tint') {
        if (!dark) continue; // the faded photo shows through
        const pixel = sample(x + w / 2, y + h / 2);
        const tinted = mix(fg, pixel, photo.strength / 100);
        const localLight = mix(pixel, bg, 1 - share);
        ops.push({ kind: 'rect', x, y, w, h, fill: toHex(darkenToContrast(tinted, [localLight, bg], ratio)) });
      } else if (dark) {
        ops.push({ kind: 'rect', x, y, w, h, fill: style.foreground });
      } else {
        ops.push({ kind: 'rect', x, y, w, h, fill: style.background, opacity: plate });
      }
    }
  }
  return ops;
}

function drawOps(ctx: CanvasRenderingContext2D, ops: PhotoOp[]): void {
  for (const op of ops) {
    ctx.globalAlpha = op.opacity ?? 1;
    if (op.kind === 'rect') {
      ctx.fillStyle = op.fill;
      ctx.fillRect(op.x, op.y, op.w, op.h);
    } else {
      ctx.drawImage(op.source, op.x, op.y, op.w, op.h);
    }
  }
  ctx.globalAlpha = 1;
}

function svgOps(ops: PhotoOp[]): string[] {
  return ops.map((op) => {
    const opacity = op.opacity === undefined ? '' : ` opacity="${op.opacity.toFixed(3)}"`;
    if (op.kind === 'rect') return `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" fill="${op.fill}"${opacity}/>`;
    // The processed photo is embedded as a data URI, so the SVG is self-contained.
    return `<image x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" preserveAspectRatio="none"${opacity} href="${op.source.toDataURL('image/jpeg', 0.92)}"/>`;
  });
}

/** Draws the code onto a 2D context sized `style.size` x `style.size`. */
async function paint(ctx: CanvasRenderingContext2D, matrix: BitMatrix, style: QrStyle): Promise<void> {
  if (style.photo) {
    drawOps(ctx, await photoOps(matrix, style));
  } else {
    const { edges, offset } = geometry(matrix, style);

    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, style.size, style.size);

    ctx.fillStyle = style.foreground;
    for (let row = 0; row < matrix.size; row += 1) {
      for (let col = 0; col < matrix.size; col += 1) {
        if (!matrix.get(row, col)) continue;
        const x = edges[col + offset];
        const y = edges[row + offset];
        ctx.fillRect(x, y, edges[col + offset + 1] - x, edges[row + offset + 1] - y);
      }
    }
  }

  if (!style.logo) return;

  const image = await loadImage(style.logo);
  const box = logoBox(style);
  ctx.fillStyle = style.background;
  roundedRectPath(ctx, box.x - box.pad, box.y - box.pad, box.size + box.pad * 2, box.size + box.pad * 2, box.size * 0.18);
  ctx.fill();

  // Preserve the logo's aspect ratio inside the square plate.
  const scale = Math.min(box.size / image.naturalWidth, box.size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, box.x + (box.size - width) / 2, box.y + (box.size - height) / 2, width, height);
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new QrRenderError('This browser did not provide a 2D canvas context.');
  return ctx;
}

/** Renders into an existing canvas — used for the live preview. */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  style: QrStyle,
): Promise<void> {
  const matrix = buildMatrix(text, renderEcc(style));
  canvas.width = style.size;
  canvas.height = style.size;
  await paint(context2d(canvas), matrix, style);
}

/** Renders off-screen and returns a PNG data URL identical to the preview. */
export async function renderToPngDataUrl(text: string, style: QrStyle): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderToCanvas(canvas, text, style);
  return canvas.toDataURL('image/png');
}

/** Renders the same geometry as vector markup for a lossless SVG download. */
export async function renderToSvg(text: string, style: QrStyle): Promise<string> {
  const matrix = buildMatrix(text, renderEcc(style));
  const layers: string[] = [];

  if (style.photo) {
    layers.push(...svgOps(await photoOps(matrix, style)));
  } else {
    const { edges, offset } = geometry(matrix, style);

    // One path for every dark module keeps the file small and editable.
    const commands: string[] = [];
    for (let row = 0; row < matrix.size; row += 1) {
      for (let col = 0; col < matrix.size; col += 1) {
        if (!matrix.get(row, col)) continue;
        const x = edges[col + offset];
        const y = edges[row + offset];
        commands.push(`M${x} ${y}h${edges[col + offset + 1] - x}v${edges[row + offset + 1] - y}h-${edges[col + offset + 1] - x}z`);
      }
    }
    layers.push(
      `<rect width="${style.size}" height="${style.size}" fill="${style.background}"/>`,
      `<path fill="${style.foreground}" d="${commands.join('')}"/>`,
    );
  }

  if (style.logo) {
    const image = await loadImage(style.logo);
    const box = logoBox(style);
    const scale = Math.min(box.size / image.naturalWidth, box.size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    layers.push(
      `<rect x="${box.x - box.pad}" y="${box.y - box.pad}" width="${box.size + box.pad * 2}" height="${box.size + box.pad * 2}" rx="${(box.size * 0.18).toFixed(2)}" fill="${style.background}"/>`,
      `<image x="${(box.x + (box.size - width) / 2).toFixed(2)}" y="${(box.y + (box.size - height) / 2).toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" href="${style.logo}"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${style.size}" height="${style.size}" viewBox="0 0 ${style.size} ${style.size}" shape-rendering="crispEdges" role="img" aria-label="QR code">${layers.join('')}</svg>`;
}

/**
 * Module grid at a fixed symbol version, for animated displays that morph
 * between payloads cell by cell (all payloads then share one grid size).
 * Additive helper: the preview and downloads keep using `buildMatrix`.
 */
export function moduleGrid(text: string, ecc: QrStyle['ecc'], version?: number): boolean[][] {
  let matrix: BitMatrix;
  try {
    matrix = QRCode.create(text, { errorCorrectionLevel: ecc, version }).modules;
  } catch {
    matrix = buildMatrix(text, ecc);
  }
  return Array.from({ length: matrix.size }, (_, row) =>
    Array.from({ length: matrix.size }, (_, col) => Boolean(matrix.get(row, col))),
  );
}
