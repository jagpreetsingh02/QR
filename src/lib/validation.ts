import type { FieldErrors, QrContent } from '../types';
import { normalisePhone, normaliseUrl } from './qrContent';

/** Upper bound accepted by a version-40 / level-L QR symbol (byte mode). */
export const MAX_PAYLOAD_BYTES = 2953;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_PATTERN = /^\+?\d{6,15}$/;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(normaliseUrl(value));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true; // other schemes are allowed as-is
    // A host needs at least one dot or be localhost, otherwise it will not resolve.
    return url.hostname === 'localhost' || /^[^.]+(\.[^.]+)+$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Validates one content variant and returns a field-keyed error map.
 * An empty map means the content is ready to encode.
 */
export function validateContent(content: QrContent): FieldErrors {
  const errors: FieldErrors = {};

  switch (content.type) {
    case 'url': {
      const value = content.url.trim();
      if (!value) errors.url = 'Enter a website address, for example gdg.community.dev.';
      else if (/\s/.test(value)) errors.url = 'A URL cannot contain spaces.';
      else if (!isValidUrl(value)) errors.url = 'That does not look like a valid URL.';
      break;
    }
    case 'text': {
      if (!content.text.trim()) errors.text = 'Enter the text you want to encode.';
      break;
    }
    case 'email': {
      const to = content.to.trim();
      if (!to) errors.to = 'Enter the recipient email address.';
      else if (!EMAIL_PATTERN.test(to)) errors.to = 'Enter a valid email address, for example team@gdgsrm.dev.';
      break;
    }
    case 'phone': {
      const raw = content.phone.trim();
      const value = normalisePhone(raw);
      if (!raw) errors.phone = 'Enter a phone number.';
      else if (/[^\d+\s()./-]/.test(raw)) errors.phone = 'Use digits only, optionally starting with “+”.';
      else if (!PHONE_PATTERN.test(value)) errors.phone = 'Enter 6–15 digits, optionally starting with “+”.';
      break;
    }
    case 'wifi': {
      if (!content.ssid.trim()) errors.ssid = 'Enter the network name (SSID).';
      if (content.encryption !== 'nopass' && !content.password) {
        errors.password = 'Enter the network password, or switch to “No password”.';
      } else if (content.encryption === 'WEP' && content.password && ![5, 10, 13, 26].includes(content.password.length)) {
        errors.password = 'WEP keys are 5, 10, 13 or 26 characters long.';
      } else if (content.encryption === 'WPA' && content.password && content.password.length < 8) {
        errors.password = 'WPA passwords are at least 8 characters long.';
      }
      break;
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Byte length of the payload — QR capacity is measured in bytes, not characters. */
export function payloadBytes(encoded: string): number {
  return new TextEncoder().encode(encoded).length;
}
