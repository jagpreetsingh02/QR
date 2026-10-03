import QRCode from 'qrcode';
import type { BitMatrix } from 'qrcode';
import type { QrStyle } from '../types';

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

export function geometry(matrix: BitMatrix, style: QrStyle): Geometry {
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
export const renderEcc = (style: QrStyle): QrStyle['ecc'] => (style.photo && (style.ecc === 'L' || style.ecc === 'M') ? 'Q' : style.ecc);

/** The photo engine is its own chunk: pages that never use a photo never load it. */
const photoEngine = () => import('./photoRender');

/** Draws the plain code onto a 2D context sized `style.size` x `style.size`. */
function paint(ctx: CanvasRenderingContext2D, matrix: BitMatrix, style: QrStyle): void {
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

/** Draws the centre logo, if any, on its background plate. */
async function paintLogo(ctx: CanvasRenderingContext2D, style: QrStyle): Promise<void> {
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

/** SVG files must be self-contained, so object-URL images are embedded as data URIs. */
function dataUri(image: HTMLImageElement, src: string): string {
  if (src.startsWith('data:')) return src;
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d')?.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
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
  if (style.photo) {
    const engine = await photoEngine();
    const ops = await engine.photoScene(text, style);
    canvas.width = style.size;
    canvas.height = style.size;
    const ctx = context2d(canvas);
    engine.drawOps(ctx, ops);
    await paintLogo(ctx, style);
    return;
  }
  const matrix = buildMatrix(text, style.ecc);
  canvas.width = style.size;
  canvas.height = style.size;
  const ctx = context2d(canvas);
  paint(ctx, matrix, style);
  await paintLogo(ctx, style);
}

/** Renders off-screen and returns a PNG data URL identical to the preview. */
export async function renderToPngDataUrl(text: string, style: QrStyle): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderToCanvas(canvas, text, style);
  return canvas.toDataURL('image/png');
}

/** Renders the same geometry as vector markup for a lossless SVG download. */
export async function renderToSvg(text: string, style: QrStyle): Promise<string> {
  const layers: string[] = [];

  if (style.photo) {
    const engine = await photoEngine();
    layers.push(...engine.svgOps(await engine.photoScene(text, style)));
  } else {
    const matrix = buildMatrix(text, style.ecc);
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
      `<image x="${(box.x + (box.size - width) / 2).toFixed(2)}" y="${(box.y + (box.size - height) / 2).toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" href="${dataUri(image, style.logo)}"/>`,
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
