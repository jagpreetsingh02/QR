import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Icon } from '../components/Icon';
import { SliderField } from '../components/fields';

/** Data URLs are stored in localStorage with the history entry, so keep uploads small. */
export const MAX_LOGO_BYTES = 256 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

interface LogoDropProps {
  logo: string | null;
  logoScale: number;
  onLogoChange: (logo: string | null) => void;
  onScaleChange: (scale: number) => void;
}

/** Centre logo: click or drag an image in; same validation as before, now with a drop state. */
export function LogoDrop({ logo, logoScale, onLogoChange, onScaleChange }: LogoDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError('Use a PNG, JPG, WebP, GIF or SVG image.');
    if (file.size > MAX_LOGO_BYTES) return setError(`That image is ${Math.round(file.size / 1024)} KB. Keep logos under ${MAX_LOGO_BYTES / 1024} KB.`);
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onLogoChange(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => setError('That image could not be read. Try another file.');
    reader.readAsDataURL(file);
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    accept(event.target.files?.[0]);
    event.target.value = ''; // allow choosing the same file again
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="logo-drop">
      <input ref={inputRef} className="visually-hidden" type="file" accept={ACCEPTED.join(',')} onChange={onInput} aria-label="Upload a centre logo" tabIndex={-1} />
      {logo ? (
        <>
          <div className="logo-drop__current">
            <img src={logo} alt="Selected logo" />
            <span>
              <strong>Centre logo</strong>
              <span>Raise error correction to Q or H.</span>
            </span>
            <button type="button" className="icon-button" onClick={() => inputRef.current?.click()} aria-label="Replace logo">
              <Icon name="restore" size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setError(null);
                onLogoChange(null);
              }}
              aria-label="Remove logo"
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
          <SliderField label="Logo size" value={logoScale} min={10} max={35} unit="%" onChange={onScaleChange} />
        </>
      ) : (
        <button
          type="button"
          className={`logo-drop__zone${dragging ? ' is-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-describedby={error ? errorId : undefined}
        >
          <Icon name="image" size={22} />
          <span>
            <strong>{dragging ? 'Drop to add the logo' : 'Add a centre logo'}</strong>
            <span>Drag an image here or click. PNG, JPG, WebP, GIF or SVG, up to {MAX_LOGO_BYTES / 1024} KB.</span>
          </span>
        </button>
      )}
      {error ? (
        <p className="field__message is-error" id={errorId} role="alert">
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
