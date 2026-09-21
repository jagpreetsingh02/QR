import { useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Icon } from './Icon';
import { SliderField } from './fields';

/** Data URLs are stored in localStorage, so keep uploads small. */
export const MAX_LOGO_BYTES = 256 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

interface LogoControlProps {
  logo: string | null;
  logoScale: number;
  onLogoChange: (logo: string | null) => void;
  onScaleChange: (scale: number) => void;
}

export function LogoControl({ logo, logoScale, onLogoChange, onScaleChange }: LogoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError('Use a PNG, JPG, WebP, GIF or SVG image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(`That image is ${Math.round(file.size / 1024)} KB. Keep logos under ${MAX_LOGO_BYTES / 1024} KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onLogoChange(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => setError('That image could not be read. Try another file.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="logo-control">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFile}
        aria-label="Upload a centre logo"
      />

      {logo ? (
        <>
          <div className="logo-preview">
            <img src={logo} alt="Selected logo preview" />
            <div className="logo-preview__meta">
              <div className="logo-preview__name">Centre logo added</div>
              <div>Use error correction Q or H so the code stays readable.</div>
            </div>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => {
                setError(null);
                onLogoChange(null);
              }}
              aria-label="Remove logo"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
          <SliderField
            label="Logo size"
            value={logoScale}
            min={10}
            max={35}
            unit="%"
            onChange={onScaleChange}
          />
        </>
      ) : (
        <button
          type="button"
          className="logo-drop"
          onClick={() => inputRef.current?.click()}
          aria-describedby={error ? errorId : undefined}
        >
          <Icon name="image" size={20} />
          <span>
            <strong>Add a centre logo</strong>
            <br />
            PNG, JPG, WebP, GIF or SVG up to {MAX_LOGO_BYTES / 1024} KB.
          </span>
        </button>
      )}

      {error ? (
        <p className="field__error" id={errorId} role="alert">
          <Icon name="warning" size={14} />
          {error}
        </p>
      ) : null}
    </div>
  );
}
