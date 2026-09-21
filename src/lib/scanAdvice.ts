import type { QrStyle, ScanWarning } from '../types';
import { contrastRatio, isInverted } from './colour';
import { MAX_PAYLOAD_BYTES, payloadBytes } from './validation';

/** Below this WCAG ratio most camera scanners fail to separate the modules. */
export const MIN_SAFE_CONTRAST = 4.5;
const CRITICAL_CONTRAST = 3;
/** The QR specification asks for a four-module quiet zone. */
const MIN_QUIET_ZONE = 4;
const MIN_COMFORTABLE_SIZE = 200;

/**
 * Inspects the current settings and reports choices that make a code harder to
 * scan. Findings are advisory — nothing here blocks generation or download.
 */
export function getScanWarnings(style: QrStyle, encoded: string): ScanWarning[] {
  const warnings: ScanWarning[] = [];
  const ratio = contrastRatio(style.foreground, style.background);

  if (ratio < CRITICAL_CONTRAST) {
    warnings.push({
      id: 'contrast-critical',
      level: 'warning',
      message: `Foreground and background are too similar (${ratio.toFixed(1)}:1). Most scanners will not read this code — aim for at least ${MIN_SAFE_CONTRAST}:1.`,
    });
  } else if (ratio < MIN_SAFE_CONTRAST) {
    warnings.push({
      id: 'contrast-low',
      level: 'warning',
      message: `Contrast is low (${ratio.toFixed(1)}:1). Scanning may fail in poor lighting — aim for at least ${MIN_SAFE_CONTRAST}:1.`,
    });
  }

  if (isInverted(style.foreground, style.background)) {
    warnings.push({
      id: 'inverted',
      level: 'info',
      message: 'Light modules on a dark background are inverted. Modern phones cope, but older scanners may not.',
    });
  }

  if (style.margin < MIN_QUIET_ZONE) {
    warnings.push({
      id: 'quiet-zone',
      level: style.margin === 0 ? 'warning' : 'info',
      message: `The quiet zone is ${style.margin} modules. The QR specification asks for ${MIN_QUIET_ZONE} so the code separates from its surroundings.`,
    });
  }

  if (style.size < MIN_COMFORTABLE_SIZE) {
    warnings.push({
      id: 'small',
      level: 'info',
      message: `At ${style.size}px the code is small for printing. Keep it at ${MIN_COMFORTABLE_SIZE}px or larger when it will be scanned from a distance.`,
    });
  }

  if (style.logo) {
    if (style.ecc === 'L' || style.ecc === 'M') {
      warnings.push({
        id: 'logo-ecc',
        level: 'warning',
        message: 'A centre logo covers data modules. Raise error correction to Q or H so the code stays readable.',
      });
    }
    if (style.logoScale > 25) {
      warnings.push({
        id: 'logo-size',
        level: 'warning',
        message: `The logo covers ${style.logoScale}% of the code. Keep it at 25% or less to stay within what error correction can recover.`,
      });
    }
  }

  const bytes = payloadBytes(encoded);
  if (bytes > MAX_PAYLOAD_BYTES * 0.8) {
    warnings.push({
      id: 'dense',
      level: 'info',
      message: `The payload is ${bytes} bytes, so the code is dense with small modules. Print it larger or shorten the content.`,
    });
  }

  return warnings;
}
