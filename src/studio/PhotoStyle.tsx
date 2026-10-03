import { useId, useState } from 'react';
import type { DragEvent } from 'react';
import type { PhotoMode, PhotoStyle as Photo } from '../types';
import { DEFAULT_PHOTO, MAX_PHOTO_BYTES, PHOTO_TYPES, PhotoError, readPhoto } from '../lib/photo';
import { SegmentedField, SliderField } from '../components/fields';
import { Icon } from '../components/Icon';

const MODES: ReadonlyArray<{ value: PhotoMode; label: string; title: string }> = [
  { value: 'tint', label: 'Tinted modules', title: 'Each module takes the colour of the photo beneath it' },
  { value: 'underlay', label: 'Photo underlay', title: 'The photo sits behind a standard code' },
];

interface PhotoStyleProps {
  photo: Photo | null;
  /** Shown after restoring a recent code that had a photo (the photo itself is never stored). */
  note: string | null;
  onChange: (photo: Photo | null) => void;
}

/**
 * Optional photo style. The file input is created on demand rather than kept
 * in the page, and the image is processed locally: it never leaves the tab.
 */
export function PhotoStyle({ photo, note, onChange }: PhotoStyleProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  const accept = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await readPhoto(file);
      setError(null);
      onChange({ ...DEFAULT_PHOTO, ...(photo ? { mode: photo.mode, strength: photo.strength, contrast: photo.contrast } : {}), src });
    } catch (cause) {
      setError(cause instanceof PhotoError ? cause.message : 'That photo could not be read. Try another file.');
    } finally {
      setBusy(false);
    }
  };

  const choose = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PHOTO_TYPES.join(',');
    input.addEventListener('change', () => void accept(input.files?.[0]), { once: true });
    input.click();
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="photo-style">
      {photo ? (
        <>
          <div className="logo-drop__current">
            <img src={photo.src} alt="Selected photo" />
            <span>
              <strong>Photo on</strong>
              <span>Never uploaded or saved.</span>
            </span>
            <button type="button" className="icon-button" onClick={choose} aria-label="Replace photo">
              <Icon name="restore" size={18} />
            </button>
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => {
                setError(null);
                onChange(null);
              }}
            >
              Remove
            </button>
          </div>
          <SegmentedField label="Blend" value={photo.mode} options={MODES} onChange={(mode) => onChange({ ...photo, mode })} />
          <SliderField
            label="Photo strength"
            value={photo.strength}
            min={0}
            max={100}
            unit="%"
            hint="How much of the photo shows. Heavier photos are harder to scan."
            onChange={(strength) => onChange({ ...photo, strength })}
          />
          <SliderField
            label="Contrast"
            value={photo.contrast}
            min={0}
            max={100}
            unit="%"
            hint="Raises the separation between dark and light modules."
            onChange={(contrast) => onChange({ ...photo, contrast })}
          />
          <p className="photo-style__note">
            <Icon name="info" size={16} />
            <span>Error correction is raised to at least Q while a photo is set, so the code can recover what the photo hides.</span>
          </p>
        </>
      ) : (
        <button
          type="button"
          className={`logo-drop__zone${dragging ? ' is-dragging' : ''}`}
          onClick={choose}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={busy}
          aria-describedby={error ? errorId : undefined}
        >
          <Icon name="image" size={22} />
          <span>
            <strong>{busy ? 'Preparing photo…' : dragging ? 'Drop to use this photo' : 'Add a photo style'}</strong>
            <span>
              Drag a photo here or click. PNG, JPG or WebP, up to {MAX_PHOTO_BYTES / 1024 / 1024} MB. Stays on this device.
            </span>
          </span>
        </button>
      )}
      {note && !photo ? (
        <p className="photo-style__note">
          <Icon name="info" size={16} />
          <span>{note}</span>
        </p>
      ) : null}
      {error ? (
        <p className="field__message is-error" id={errorId} role="alert">
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
