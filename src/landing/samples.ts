import type { QrContent, QrType } from '../types';
import { encodeContent } from '../lib/qrContent';

export interface Sample {
  type: QrType;
  label: string;
  /** What the person types, as field/value pairs. */
  fields: Array<[string, string]>;
  content: QrContent;
  /** Why the encoding detail matters, in one sentence. */
  detail: string;
}

/**
 * Demonstration data for the landing page. Every payload is produced by the
 * studio's own encoder, so what the page shows is exactly what gets encoded.
 * All of them fit QR version 4 at level M, which lets the codes morph cell by cell.
 */
export const SAMPLES: Sample[] = [
  {
    type: 'url',
    label: 'URL',
    fields: [['Website', 'gdg.community.dev']],
    content: { type: 'url', url: 'gdg.community.dev' },
    detail: 'The missing https:// is added, otherwise many scanners treat the code as plain text instead of a link.',
  },
  {
    type: 'text',
    label: 'Text',
    fields: [['Text', 'See you at the info session!']],
    content: { type: 'text', text: 'See you at the info session!' },
    detail: 'Any text works. Capacity is measured in bytes, not characters, so the studio counts bytes for you.',
  },
  {
    type: 'email',
    label: 'Email',
    fields: [
      ['To', 'team@gdgsrm.dev'],
      ['Subject', 'Hello GDG'],
    ],
    content: { type: 'email', to: 'team@gdgsrm.dev', subject: 'Hello GDG', body: '' },
    detail: 'Spaces become %20, not +, so mail apps show your subject exactly as written.',
  },
  {
    type: 'phone',
    label: 'Phone',
    fields: [['Number', '+91 98765 43210']],
    content: { type: 'phone', phone: '+91 98765 43210' },
    detail: 'Spaces and brackets are stripped, because tel: links fail on them in some dialers.',
  },
  {
    type: 'wifi',
    label: 'Wi-Fi',
    fields: [
      ['Network', 'GDG-Campus'],
      ['Password', 'build;with;gdg'],
    ],
    content: { type: 'wifi', ssid: 'GDG-Campus', password: 'build;with;gdg', encryption: 'WPA', hidden: false },
    detail: 'The semicolons in this password are escaped. Unescaped, phones would read a different password and fail to join.',
  },
];

export const encoded = (sample: Sample) => encodeContent(sample.content);

/** The hero cycles through these three. */
export const HERO_SAMPLES = ['url', 'wifi', 'phone'].map((t) => SAMPLES.find((s) => s.type === t)!) as Sample[];
