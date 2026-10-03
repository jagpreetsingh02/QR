import type { QrStyle, ScanWarning } from '../types';
import { contrastRatio } from '../lib/colour';
import { MIN_SAFE_CONTRAST } from '../lib/scanAdvice';

export type Status = 'ok' | 'warn' | 'bad';

export interface Reading {
  label: string;
  value: string;
  status: Status;
}

const RECOVERY: Record<QrStyle['ecc'], string> = { L: '7%', M: '15%', Q: '25%', H: '30%' };

/** The measured facts the scan check shows; thresholds mirror lib/scanAdvice. */
export function getReadings(style: QrStyle): Reading[] {
  const ratio = contrastRatio(style.foreground, style.background);
  return [
    { label: 'Contrast', value: `${ratio.toFixed(1)}:1`, status: ratio >= MIN_SAFE_CONTRAST ? 'ok' : ratio >= 3 ? 'warn' : 'bad' },
    { label: 'Quiet zone', value: `${style.margin} module${style.margin === 1 ? '' : 's'}`, status: style.margin >= 4 ? 'ok' : style.margin > 0 ? 'warn' : 'bad' },
    { label: 'Size', value: `${style.size} px`, status: style.size >= 200 ? 'ok' : 'warn' },
    { label: 'Recovers', value: `${RECOVERY[style.ecc]} (${style.ecc})`, status: style.logo && (style.ecc === 'L' || style.ecc === 'M') ? 'warn' : 'ok' },
  ];
}

export interface Verdict {
  status: Status;
  title: string;
  detail: string;
}

/** One-line summary of the scan check, for places with no room for the panel. */
export function getVerdict(style: QrStyle, warnings: ScanWarning[], decode: 'pending' | 'pass' | 'fail' | null = null): Verdict {
  if (decode === 'fail') return { status: 'bad', title: 'Didn’t decode', detail: 'try Boost readability' };
  if (decode === 'pending') return { status: 'warn', title: 'Test-scanning…', detail: 'photo style' };
  const readings = getReadings(style);
  const worst = readings.find((r) => r.status === 'bad') ?? readings.find((r) => r.status === 'warn');
  const hasWarning = warnings.some((w) => w.level === 'warning');
  if (worst?.status === 'bad') return { status: 'bad', title: 'Likely won’t scan', detail: `${worst.label} ${worst.value}` };
  if (worst || hasWarning) return { status: 'warn', title: 'Check before printing', detail: worst ? `${worst.label} ${worst.value}` : `${warnings.length} note${warnings.length === 1 ? '' : 's'}` };
  if (decode === 'pass') return { status: 'ok', title: 'Decodes', detail: 'test scan passed' };
  return { status: 'ok', title: 'No scan risks', detail: `${readings[0].value} contrast` };
}
