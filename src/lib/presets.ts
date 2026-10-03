import type { QrStyle } from '../types';

/** The visual slice of a style that a preset controls. */
export type PresetStyle = Pick<QrStyle, 'foreground' | 'background' | 'margin'>;

export interface Preset extends PresetStyle {
  id: string;
  name: string;
}

/**
 * Presets only touch appearance, so size, error correction and any logo the
 * user has already chosen survive when one is applied.
 */
export const PRESETS: Preset[] = [
  { id: 'classic', name: 'Classic', foreground: '#111827', background: '#ffffff', margin: 4 },
  { id: 'midnight', name: 'Midnight', foreground: '#f8fafc', background: '#0b1120', margin: 4 },
  { id: 'campus-blue', name: 'Campus', foreground: '#174ea6', background: '#e8f0fe', margin: 4 },
  { id: 'forest', name: 'Forest', foreground: '#14532d', background: '#ecfdf5', margin: 4 },
  { id: 'sunset', name: 'Sunset', foreground: '#7c2d12', background: '#fff7ed', margin: 5 },
  { id: 'grape', name: 'Grape', foreground: '#4c1d95', background: '#f5f3ff', margin: 4 },
  { id: 'crimson', name: 'Crimson', foreground: '#9f1239', background: '#fff1f2', margin: 4 },
  { id: 'blueprint', name: 'Blueprint', foreground: '#e0f2fe', background: '#0c4a6e', margin: 6 },
];

export const DEFAULT_STYLE: QrStyle = {
  size: 320,
  foreground: PRESETS[0].foreground,
  background: PRESETS[0].background,
  ecc: 'M',
  margin: PRESETS[0].margin,
  logo: null,
  logoScale: 20,
  photo: null,
};

/** Returns the preset whose appearance the style currently matches, if any. */
export function matchPreset(style: PresetStyle): Preset | undefined {
  return PRESETS.find(
    (preset) =>
      preset.foreground.toLowerCase() === style.foreground.toLowerCase() &&
      preset.background.toLowerCase() === style.background.toLowerCase() &&
      preset.margin === style.margin,
  );
}
