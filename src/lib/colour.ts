export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses `#rgb` / `#rrggbb`. Returns null for anything else. */
export function hexToRgb(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function isHexColour(value: string): boolean {
  return hexToRgb(value) !== null;
}

/** Normalises any accepted hex form to lowercase `#rrggbb`. */
export function normaliseHex(value: string, fallback: string): string {
  const rgb = hexToRgb(value);
  if (!rgb) return fallback;
  return `#${[rgb.r, rgb.g, rgb.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colours, 1–21. */
export function contrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 1;
  const lightest = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darkest = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lightest + 0.05) / (darkest + 0.05);
}

/** True when the modules are lighter than the background (inverted QR). */
export function isInverted(foreground: string, background: string): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return false;
  return relativeLuminance(fg) > relativeLuminance(bg);
}

/** Picks black or white text that reads on top of the supplied colour. */
export function readableTextOn(background: string): string {
  return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background)
    ? '#000000'
    : '#ffffff';
}
