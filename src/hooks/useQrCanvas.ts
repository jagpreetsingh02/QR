import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { QrStyle } from '../types';
import { renderToCanvas } from '../lib/render';

interface QrCanvasState {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Message shown when the payload cannot be encoded at the current settings. */
  error: string | null;
  /** True when the canvas holds a usable image for the current inputs. */
  isRendered: boolean;
}

/**
 * Keeps a canvas in sync with the encoded payload and style. Rendering is
 * async (a logo may still need decoding), so stale runs are discarded and the
 * previous frame stays on screen until the new one is painted.
 */
export function useQrCanvas(text: string, style: QrStyle, enabled: boolean): QrCanvasState {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !text || !canvas) return;

    let cancelled = false;
    renderToCanvas(canvas, text, style)
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'The QR code could not be rendered.');
      });

    return () => {
      cancelled = true;
    };
  }, [text, style, enabled]);

  // A stale error from a previous payload must not leak into an invalid form.
  const activeError = enabled && text ? error : null;

  return { canvasRef, error: activeError, isRendered: enabled && text.length > 0 && !activeError };
}
