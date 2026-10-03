import type { QrContent } from '../types';

/**
 * Masks the Wi-Fi password inside an encoded payload for on-screen display.
 * The QR code itself is unaffected; this only keeps passwords off the screen
 * (and out of screen-reader output) unless the person asks to see them.
 */
export function maskPayload(encoded: string, content: QrContent): string {
  if (content.type !== 'wifi' || !content.password || content.encryption === 'nopass') return encoded;
  return encoded.replace(/(;P:)((?:\\.|[^;\\])*)/, (_, prefix: string, secret: string) => `${prefix}${'•'.repeat(Math.min(secret.length, 12))}`);
}
