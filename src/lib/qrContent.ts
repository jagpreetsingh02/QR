import type { ContentDrafts, QrContent, QrType } from '../types';

interface TypeMeta {
  label: string;
  /** Short hint shown under the type tabs. */
  description: string;
  icon: string;
}

export const QR_TYPE_META: Record<QrType, TypeMeta> = {
  url: {
    label: 'URL',
    description: 'Open a website when scanned.',
    icon: 'link',
  },
  text: {
    label: 'Text',
    description: 'Show any plain text message.',
    icon: 'text',
  },
  email: {
    label: 'Email',
    description: 'Start a pre-filled email draft.',
    icon: 'mail',
  },
  phone: {
    label: 'Phone',
    description: 'Dial a phone number.',
    icon: 'phone',
  },
  wifi: {
    label: 'Wi-Fi',
    description: 'Join a network without typing a password.',
    icon: 'wifi',
  },
};

export const EMPTY_DRAFTS: ContentDrafts = {
  url: { type: 'url', url: '' },
  text: { type: 'text', text: '' },
  email: { type: 'email', to: '', subject: '', body: '' },
  phone: { type: 'phone', phone: '' },
  wifi: { type: 'wifi', ssid: '', password: '', encryption: 'WPA', hidden: false },
};

export function createEmptyDrafts(): ContentDrafts {
  return structuredClone(EMPTY_DRAFTS);
}

/**
 * Adds a scheme to bare hosts (`gdgsrm.com` -> `https://gdgsrm.com`) so the
 * scanned code always opens instead of being treated as plain text.
 */
export function normaliseUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^mailto:/i.test(value)) return value;
  return `https://${value}`;
}

/** Strips spaces and separators that phones tolerate but `tel:` does not. */
export function normalisePhone(raw: string): string {
  const value = raw.trim().replace(/[\s()./-]/g, '');
  return value;
}

/** Escapes the reserved characters of the `WIFI:` payload grammar. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function encodeMailtoParams(subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject.trim()) params.set('subject', subject.trim());
  if (body.trim()) params.set('body', body);
  const query = params.toString().replace(/\+/g, '%20');
  return query ? `?${query}` : '';
}

/** Turns structured content into the exact string stored in the QR code. */
export function encodeContent(content: QrContent): string {
  switch (content.type) {
    case 'url':
      return normaliseUrl(content.url);
    case 'text':
      return content.text;
    case 'email':
      return `mailto:${content.to.trim()}${encodeMailtoParams(content.subject, content.body)}`;
    case 'phone':
      return `tel:${normalisePhone(content.phone)}`;
    case 'wifi': {
      const parts = [
        `T:${content.encryption}`,
        `S:${escapeWifi(content.ssid)}`,
        content.encryption === 'nopass' ? '' : `P:${escapeWifi(content.password)}`,
        content.hidden ? 'H:true' : '',
      ].filter(Boolean);
      return `WIFI:${parts.join(';')};;`;
    }
  }
}

/** Human-readable one-liner used for history entries. */
export function describeContent(content: QrContent): string {
  switch (content.type) {
    case 'url':
      return normaliseUrl(content.url);
    case 'text':
      return content.text.replace(/\s+/g, ' ').trim();
    case 'email':
      return content.to.trim();
    case 'phone':
      return normalisePhone(content.phone);
    case 'wifi':
      return content.ssid;
  }
}
