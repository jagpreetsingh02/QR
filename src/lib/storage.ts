import type { HistoryEntry, QrStyle } from '../types';
import { QR_TYPES } from '../types';
import { DEFAULT_STYLE } from './presets';
import { isHexColour } from './colour';
import { parsePhoto } from './photo';

export const HISTORY_KEY = 'qr-studio:history:v1';
export const THEME_KEY = 'qr-studio:theme:v1';
/** Kept small so the whole history comfortably fits in localStorage. */
export const HISTORY_LIMIT = 12;

/** localStorage throws in private mode and when disabled — never let that break the app. */
function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Rebuilds a trusted style object from unknown JSON, filling gaps with defaults. */
function parseStyle(raw: unknown): QrStyle {
  if (!isRecord(raw)) return { ...DEFAULT_STYLE };
  const ecc = raw.ecc;
  return {
    size: typeof raw.size === 'number' ? clamp(raw.size, 128, 1024) : DEFAULT_STYLE.size,
    foreground: typeof raw.foreground === 'string' && isHexColour(raw.foreground) ? raw.foreground : DEFAULT_STYLE.foreground,
    background: typeof raw.background === 'string' && isHexColour(raw.background) ? raw.background : DEFAULT_STYLE.background,
    ecc: ecc === 'L' || ecc === 'M' || ecc === 'Q' || ecc === 'H' ? ecc : DEFAULT_STYLE.ecc,
    margin: typeof raw.margin === 'number' ? clamp(Math.round(raw.margin), 0, 10) : DEFAULT_STYLE.margin,
    // Older entries embedded the logo as a data URL; newer ones keep an IndexedDB reference.
    logo: typeof raw.logo === 'string' && raw.logo.startsWith('data:image/') ? raw.logo : null,
    logoRef: typeof raw.logoRef === 'string' ? raw.logoRef : null,
    logoScale: typeof raw.logoScale === 'number' ? clamp(Math.round(raw.logoScale), 10, 35) : DEFAULT_STYLE.logoScale,
    // Photo settings and a reference only; the image itself lives in IndexedDB.
    photo: parsePhoto(raw.photo),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseEntry(raw: unknown): HistoryEntry | null {
  if (!isRecord(raw)) return null;
  const { id, createdAt, encoded, label, content, thumbnail } = raw;
  if (typeof id !== 'string' || typeof encoded !== 'string' || !encoded) return null;
  if (!isRecord(content) || typeof content.type !== 'string') return null;
  if (!QR_TYPES.includes(content.type as (typeof QR_TYPES)[number])) return null;

  return {
    id,
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
    encoded,
    label: typeof label === 'string' ? label : encoded,
    content: content as HistoryEntry['content'],
    style: parseStyle(raw.style),
    thumbnail: typeof thumbnail === 'string' ? thumbnail : '',
    photoOmitted: raw.photoOmitted === true,
  };
}

/** Reads the saved history, discarding anything that no longer parses. */
export function loadHistory(): HistoryEntry[] {
  const raw = safeRead(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseEntry)
      .filter((entry): entry is HistoryEntry => entry !== null)
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Persists the history, dropping the oldest entries if the browser quota is
 * exceeded (logos and thumbnails make entries relatively heavy).
 */
export function saveHistory(entries: HistoryEntry[]): void {
  let candidate = entries.slice(0, HISTORY_LIMIT);
  while (candidate.length > 0) {
    if (safeWrite(HISTORY_KEY, JSON.stringify(candidate))) return;
    candidate = candidate.slice(0, candidate.length - 1);
  }
  safeWrite(HISTORY_KEY, '[]');
}

export function loadTheme(): 'light' | 'dark' | null {
  const value = safeRead(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function saveTheme(theme: 'light' | 'dark'): void {
  safeWrite(THEME_KEY, theme);
}
