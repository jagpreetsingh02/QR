import type { FieldErrors, QrContent, WifiEncryption } from '../types';
import { SelectField, SwitchField, TextAreaField, TextField } from './fields';

interface ContentFormProps {
  content: QrContent;
  errors: FieldErrors;
  onChange: (content: QrContent) => void;
}

const WIFI_OPTIONS: ReadonlyArray<{ value: WifiEncryption; label: string }> = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP', label: 'WEP (legacy)' },
  { value: 'nopass', label: 'No password (open)' },
];

/** Renders the input fields that belong to the currently selected QR type. */
export function ContentForm({ content, errors, onChange }: ContentFormProps) {
  switch (content.type) {
    case 'url':
      return (
        <div className="fields">
          <TextField
            label="Website URL"
            value={content.url}
            error={errors.url}
            hint="https:// is added automatically when you leave it out."
            placeholder="gdg.community.dev/gdg-on-campus-srm"
            inputMode="url"
            autoComplete="url"
            onChange={(url) => onChange({ ...content, url })}
          />
        </div>
      );

    case 'text':
      return (
        <div className="fields">
          <TextAreaField
            label="Text"
            value={content.text}
            error={errors.text}
            hint="Any plain text — notes, codes, short messages."
            placeholder="See you at the GDG on Campus SRM info session!"
            rows={5}
            onChange={(text) => onChange({ ...content, text })}
          />
        </div>
      );

    case 'email':
      return (
        <div className="fields">
          <TextField
            label="Recipient"
            value={content.to}
            error={errors.to}
            placeholder="team@gdgsrm.dev"
            type="email"
            inputMode="email"
            autoComplete="email"
            onChange={(to) => onChange({ ...content, to })}
          />
          <TextField
            label="Subject"
            value={content.subject}
            optional
            placeholder="Recruitment 2026 — question"
            onChange={(subject) => onChange({ ...content, subject })}
          />
          <TextAreaField
            label="Message"
            value={content.body}
            optional
            placeholder="Hi team, I would like to know more about…"
            rows={4}
            onChange={(body) => onChange({ ...content, body })}
          />
        </div>
      );

    case 'phone':
      return (
        <div className="fields">
          <TextField
            label="Phone number"
            value={content.phone}
            error={errors.phone}
            hint="Include the country code so the number dials from anywhere."
            placeholder="+91 98765 43210"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            onChange={(phone) => onChange({ ...content, phone })}
          />
        </div>
      );

    case 'wifi':
      return (
        <div className="fields">
          <TextField
            label="Network name (SSID)"
            value={content.ssid}
            error={errors.ssid}
            placeholder="GDG-Campus-WiFi"
            onChange={(ssid) => onChange({ ...content, ssid })}
          />
          <SelectField
            label="Security"
            value={content.encryption}
            options={WIFI_OPTIONS}
            onChange={(encryption) => onChange({ ...content, encryption })}
          />
          {content.encryption === 'nopass' ? null : (
            <TextField
              label="Password"
              value={content.password}
              error={errors.password}
              hint="Stored only in your browser — nothing is uploaded."
              placeholder="Network password"
              type="password"
              autoComplete="off"
              onChange={(password) => onChange({ ...content, password })}
            />
          )}
          <SwitchField
            label="Hidden network"
            checked={content.hidden}
            onChange={(hidden) => onChange({ ...content, hidden })}
          />
        </div>
      );
  }
}
