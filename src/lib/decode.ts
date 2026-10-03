/**
 * Test-scans a rendered canvas in the browser with jsQR, loaded on demand so
 * it costs nothing until a photo style is used.
 */
type JsQr = typeof import('jsqr').default;
let decoder: Promise<JsQr> | null = null;

/** Largest edge the decoder sees; plenty for a reliable read and fast to scan. */
const DECODE_EDGE = 640;

export async function decodeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  decoder ??= import('jsqr').then((mod) => mod.default);
  const jsQR = await decoder;
  const size = Math.min(DECODE_EDGE, canvas.width);
  const probe = document.createElement('canvas');
  probe.width = size;
  probe.height = size;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return jsQR(data, size, size, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}
