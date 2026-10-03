/** Shared domain types for the QR generator. */

export const QR_TYPES = ['url', 'text', 'email', 'phone', 'wifi'] as const;
export type QrType = (typeof QR_TYPES)[number];

export const WIFI_ENCRYPTIONS = ['WPA', 'WEP', 'nopass'] as const;
export type WifiEncryption = (typeof WIFI_ENCRYPTIONS)[number];

export const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export type EccLevel = (typeof ECC_LEVELS)[number];

/** Discriminated union describing everything a QR code can encode here. */
export type QrContent =
  | { type: 'url'; url: string }
  | { type: 'text'; text: string }
  | { type: 'email'; to: string; subject: string; body: string }
  | { type: 'phone'; phone: string }
  | {
      type: 'wifi';
      ssid: string;
      password: string;
      encryption: WifiEncryption;
      hidden: boolean;
    };

/** Narrows `QrContent` to a single variant, e.g. `ContentOf<'wifi'>`. */
export type ContentOf<T extends QrType> = Extract<QrContent, { type: T }>;

/** One draft per type, so switching types never loses what was typed. */
export type ContentDrafts = { [T in QrType]: ContentOf<T> };

/** How a photo is combined with the code. `dots` is the halftone Photo QR. */
export type PhotoMode = 'dots' | 'tint' | 'underlay';
export type DotShape = 'circle' | 'rounded' | 'square';

/**
 * Optional photo style. The image is processed locally; at runtime `src` is
 * an object URL and `ref` points at the downscaled blob in IndexedDB. It is
 * never put in the URL, and recent codes keep only the reference.
 */
export interface PhotoStyle {
  /** Object URL (or data URL) of the downscaled photo; empty in saved history. */
  src: string;
  /** IndexedDB id of the stored blob, when storage is available. */
  ref?: string | null;
  mode: PhotoMode;
  /** Tinted/underlay: how much of the photo shows, 0–100. */
  strength: number;
  /** Tinted/underlay: separation between dark and light modules, 0–100. */
  contrast: number;
  /** Dots: dot diameter as a percentage of the module, 25–80. */
  dotScale: number;
  dotShape: DotShape;
  /** Dots: opposite-ink halo strength, 0–100 (scaled by the photo's local tone). */
  halo: number;
  /** Dots: opacity of the light plate behind each eye, 50–100. */
  eyeOpacity: number;
  /** Photo adjustments: brightness and contrast −50…50, saturation 0–200 (%). */
  brightness: number;
  photoContrast: number;
  saturation: number;
  /** Compresses the photo's tones toward mid-grey so both inks stay visible, 0–100. */
  readability: number;
  /** Rounded plate behind the whole code, with an optional border colour. */
  plate: boolean;
  border: string;
  /** Extra QR versions above the minimum (0 = auto): more, smaller modules. */
  detail: number;
}

/** Visual + encoding settings applied to the rendered QR code. */
export interface QrStyle {
  /** Output edge length in pixels (square). */
  size: number;
  /** Module (dark) colour as `#rrggbb`. */
  foreground: string;
  /** Background colour as `#rrggbb`. */
  background: string;
  /** Error correction level. */
  ecc: EccLevel;
  /** Quiet-zone width measured in modules. */
  margin: number;
  /** Optional centre logo (object URL at runtime, data URL in older entries). */
  logo: string | null;
  /** IndexedDB id of the stored logo blob. */
  logoRef?: string | null;
  /** Logo width as a percentage of the QR edge. */
  logoScale: number;
  /** Optional photo style; `null` renders the plain code. */
  photo: PhotoStyle | null;
}

/** Severity used by the scan-reliability advisor. */
export type WarningLevel = 'warning' | 'info';

export interface ScanWarning {
  id: string;
  level: WarningLevel;
  message: string;
}

/** A field-keyed map of validation messages; empty means valid. */
export type FieldErrors = Partial<Record<string, string>>;

export interface HistoryEntry {
  id: string;
  createdAt: number;
  /** Encoded payload — also used as the de-duplication key. */
  encoded: string;
  label: string;
  content: QrContent;
  style: QrStyle;
  /** Small PNG data URL used for the history thumbnail. */
  thumbnail: string;
  /** Legacy flag from builds that never stored photos. */
  photoOmitted?: boolean;
}
