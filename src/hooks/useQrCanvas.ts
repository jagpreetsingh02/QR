import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { QrStyle } from '../types';
import { renderToCanvas } from '../lib/render';
import { decodeCanvas } from '../lib/decode';

/** Photo renders do real image work, so they wait for a short pause in input. */
const PHOTO_RENDER_DELAY_MS = 120;

export type DecodeStatus = 'pending' | 'pass' | 'fail';

interface QrCanvasState {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Message shown when the payload cannot be encoded at the current settings. */
  error: string | null;
  /** True when the canvas holds a usable image for the current inputs. */
  isRendered: boolean;
  /** Photo styles only: whether the rendered canvas decodes back to `text`. */
  decode: DecodeStatus | null;
}

/**
 * Keeps a canvas in sync with the encoded payload and style. Rendering is
 * async (a logo may still need decoding), so stale runs are discarded and the
 * previous frame stays on screen until the new one is painted.
 */
export function useQrCanvas(text: string, style: QrStyle, enabled: boolean): QrCanvasState {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<{ text: string; style: QrStyle; ok: boolean } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !text || !canvas) return;

    let cancelled = false;
    const run = () =>
      renderToCanvas(canvas, text, style)
        .then(() => {
          if (cancelled) return;
          setError(null);
          // Photo styles are test-scanned after every render.
          if (style.photo) {
            void decodeCanvas(canvas).then((result) => {
              if (!cancelled) setScan({ text, style, ok: result === text });
            });
          }
        })
        .catch((cause: unknown) => {
          if (cancelled) return;
          setError(cause instanceof Error ? cause.message : 'The QR code could not be rendered.');
        });

    // Plain codes render immediately, exactly as before; photo codes are debounced.
    const timer = style.photo ? window.setTimeout(run, PHOTO_RENDER_DELAY_MS) : (run(), undefined);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [text, style, enabled]);

  // A stale error from a previous payload must not leak into an invalid form.
  const activeError = enabled && text ? error : null;
  const isRendered = enabled && text.length > 0 && !activeError;

  let decode: DecodeStatus | null = null;
  if (style.photo && isRendered) decode = scan && scan.text === text && scan.style === style ? (scan.ok ? 'pass' : 'fail') : 'pending';

  return { canvasRef, error: activeError, isRendered, decode };
}
