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
  /** Optional centre logo as a data URL. */
  logo: string | null;
  /** Logo width as a percentage of the QR edge. */
  logoScale: number;
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
}
