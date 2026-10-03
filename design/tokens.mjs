/**
 * Single source of truth for QR Studio design tokens.
 * `node design/build-tokens.mjs` writes src/styles/tokens.css and the Figma
 * variable script from this file, so names match exactly in both places
 * (Figma `color/bg` <-> CSS `--color-bg`).
 */

export const primitives = {
  neutral: {
    0: '#FFFFFF', 25: '#F8F9FC', 50: '#F1F3F8', 75: '#EEF1F7', 100: '#E1E5EE', 200: '#D2D7E3',
    300: '#B3BBCC', 400: '#8A93A8', 500: '#69738A', 550: '#5F6980', 600: '#4B5368', 700: '#343B4E',
    800: '#262D40', 850: '#1B2132', 900: '#141927', 925: '#0F1320', 950: '#0A0D17', 975: '#070910',
  },
  blue: { 100: '#E8F0FE', 200: '#AECBFA', 300: '#8AB4F8', 500: '#4285F4', 600: '#1A73E8', 700: '#1967D2', 800: '#185ABC', 950: '#1A2A4A' },
  red: { 100: '#FCE8E6', 300: '#F28B82', 500: '#EA4335', 700: '#C5221F', 950: '#2C1615' },
  yellow: { 100: '#FEF7E0', 300: '#FDD663', 500: '#FBBC04', 800: '#7A4F01', 950: '#2A2410' },
  green: { 100: '#E6F4EA', 300: '#81C995', 500: '#34A853', 800: '#137333', 950: '#13261C' },
};

/** Semantic colours: [light, dark] as primitive references (`ramp.step`). */
export const semantic = {
  'bg': ['neutral.25', 'neutral.950'],
  'bg-sunken': ['neutral.50', 'neutral.975'],
  'surface': ['neutral.0', 'neutral.900'],
  'surface-raised': ['neutral.0', 'neutral.850'],
  'surface-inset': ['neutral.50', 'neutral.925'],
  'stage': ['neutral.75', 'neutral.925'],
  'border': ['neutral.100', 'neutral.800'],
  'border-strong': ['neutral.400', 'neutral.500'],
  'text': ['neutral.900', 'neutral.0'],
  'text-muted': ['neutral.600', 'neutral.300'],
  'text-subtle': ['neutral.550', 'neutral.400'],
  'text-inverse': ['neutral.0', 'neutral.950'],
  'primary': ['blue.700', 'blue.300'],
  'primary-hover': ['blue.800', 'blue.200'],
  'on-primary': ['neutral.0', 'neutral.950'],
  'primary-soft': ['blue.100', 'blue.950'],
  'on-primary-soft': ['blue.800', 'blue.200'],
  'focus': ['blue.600', 'blue.300'],
  'success': ['green.800', 'green.300'],
  'success-soft': ['green.100', 'green.950'],
  'warning': ['yellow.800', 'yellow.300'],
  'warning-soft': ['yellow.100', 'yellow.950'],
  'danger': ['red.700', 'red.300'],
  'danger-soft': ['red.100', 'red.950'],
  'brand-blue': ['blue.500', 'blue.500'],
  'brand-red': ['red.500', 'red.500'],
  'brand-yellow': ['yellow.500', 'yellow.500'],
  'brand-green': ['green.500', 'green.500'],
  'on-brand': ['neutral.900', 'neutral.900'],
};

export const space = { '0-5': 2, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64, '20': 80, '24': 96, '32': 128 };
export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, '2xl': 40, full: 999 };

/** Seconds (Figma TIMING) — CSS gets milliseconds. */
export const duration = { fast: 0.12, base: 0.2, slow: 0.32, deliberate: 0.56 };
export const easing = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 0.8, 0.15],
};

export const fonts = {
  display: { family: 'Bricolage Grotesque', css: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif" },
  body: { family: 'Figtree', css: "'Figtree Variable', 'Figtree', ui-sans-serif, system-ui, sans-serif" },
  mono: { family: 'JetBrains Mono', css: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
};

/**
 * Type ramp. `size` is the desktop size; `min` is the mobile floor used by the
 * CSS clamp(). Letter spacing in percent of font size (Figma PERCENT units).
 */
export const type = {
  'display-xl': { font: 'display', weight: 800, size: 84, min: 46, lh: 0.94, ls: -3.5 },
  'display-l': { font: 'display', weight: 750, size: 56, min: 36, lh: 1.0, ls: -2.5 },
  'display-m': { font: 'display', weight: 700, size: 40, min: 30, lh: 1.06, ls: -1.8 },
  'title-l': { font: 'display', weight: 700, size: 28, min: 24, lh: 1.15, ls: -1 },
  'title-m': { font: 'body', weight: 650, size: 19, min: 18, lh: 1.3, ls: -0.4 },
  'body-l': { font: 'body', weight: 450, size: 19, min: 17, lh: 1.55, ls: 0 },
  'body-m': { font: 'body', weight: 450, size: 16, min: 16, lh: 1.55, ls: 0 },
  'body-s': { font: 'body', weight: 450, size: 14, min: 14, lh: 1.5, ls: 0 },
  'label': { font: 'body', weight: 600, size: 13, min: 13, lh: 1.3, ls: 0.2 },
  'mono': { font: 'mono', weight: 450, size: 13, min: 13, lh: 1.55, ls: 0 },
};

export const elevation = {
  1: '0 1px 2px rgba(20, 25, 39, 0.06), 0 1px 1px rgba(20, 25, 39, 0.04)',
  2: '0 2px 4px rgba(20, 25, 39, 0.05), 0 8px 24px -8px rgba(20, 25, 39, 0.16)',
  3: '0 4px 8px rgba(20, 25, 39, 0.06), 0 24px 56px -20px rgba(20, 25, 39, 0.28)',
};

export function resolve(ref) {
  const [ramp, step] = ref.split('.');
  return primitives[ramp][step];
}
