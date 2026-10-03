import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Icon } from '../components/Icon';
import { SliderField } from '../components/fields';

import { ImageError, LOGO_RULES, processImage } from '../lib/images';
import { putImage } from '../lib/imageStore';

interface LogoDropProps {
  logo: string | null;
  logoScale: number;
  onLogoChange: (logo: string | null, ref?: string | null) => void;
  onScaleChange: (scale: number) => void;
}

/** Centre logo: click or drag an image in; same validation as before, now with a drop state. */
export function LogoDrop({ logo, logoScale, onLogoChange, onScaleChange }: LogoDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  const [busy, setBusy] = useState(false);

  // Decoded, downscaled to 1024 px and stored locally in IndexedDB (never uploaded).
  const accept = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await processImage(file, LOGO_RULES);
      const ref = await putImage(blob);
      setError(null);
      onLogoChange(URL.createObjectURL(blob), ref);
    } catch (cause) {
      setError(cause instanceof ImageError ? cause.message : 'That logo could not be read. Try another file.');
    } finally {
      setBusy(false);
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void accept(event.target.files?.[0]);
    event.target.value = ''; // allow choosing the same file again
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="logo-drop">
      <input ref={inputRef} className="visually-hidden" type="file" accept={LOGO_RULES.types.join(',')} onChange={onInput} aria-label="Upload a centre logo" tabIndex={-1} />
      {logo ? (
        <>
          <div className="logo-drop__current">
            <img src={logo} alt="Selected logo" />
            <span>
              <strong>Centre logo</strong>
              <span>Raise error correction to Q or H.</span>
            </span>
            <button type="button" className="icon-button" onClick={() => inputRef.current?.click()} aria-label="Replace logo">
              <Icon name="swap" size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setError(null);
                onLogoChange(null, null);
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
            <strong>{busy ? 'Preparing logo…' : dragging ? 'Drop to add the logo' : 'Add a centre logo'}</strong>
            <span>Drag an image here or click. PNG, JPG, WebP, GIF, AVIF up to 10 MB, or SVG up to 2 MB.</span>
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
