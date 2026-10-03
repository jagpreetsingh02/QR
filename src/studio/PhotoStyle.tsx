import { useId, useState } from 'react';
import type { DragEvent } from 'react';
import type { DotShape, PhotoMode, PhotoStyle as Photo } from '../types';
import { DEFAULT_PHOTO } from '../lib/photo';
import { ImageError, PHOTO_RULES, processImage } from '../lib/images';
import { putImage } from '../lib/imageStore';
import { SegmentedField, SliderField, SwitchField } from '../components/fields';
import { ColourField } from '../components/ColourField';
import { Icon } from '../components/Icon';

const MODES: ReadonlyArray<{ value: PhotoMode; label: string; title: string }> = [
  { value: 'dots', label: 'Dots', title: 'Full-colour photo with the code carried by small dots' },
  { value: 'tint', label: 'Tinted', title: 'Each module takes the colour of the photo beneath it' },
  { value: 'underlay', label: 'Underlay', title: 'The photo sits behind a standard code' },
];

const SHAPES: ReadonlyArray<{ value: DotShape; label: string }> = [
  { value: 'circle', label: 'Circle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'square', label: 'Square' },
];

const DETAIL: ReadonlyArray<{ value: string; label: string; title: string }> = [
  { value: '0', label: 'Auto', title: 'The smallest code that fits your content' },
  { value: '2', label: '+2', title: 'Two versions up: more, smaller modules' },
  { value: '4', label: '+4', title: 'Four versions up' },
  { value: '6', label: '+6', title: 'Six versions up: sharpest photo, smallest modules' },
];

interface PhotoStyleProps {
  photo: Photo | null;
  /** Shown after restoring a recent code whose stored photo is no longer available. */
  note: string | null;
  /** Bytes of the encoded payload, for the short-link tip. */
  payloadBytes: number;
  onChange: (photo: Photo | null) => void;
}

/**
 * Photo QR controls. The file input is created on demand rather than kept in
 * the page; the photo is decoded, downscaled and stored on this device only.
 */
export function PhotoStyle({ photo, note, payloadBytes, onChange }: PhotoStyleProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  const accept = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await processImage(file, PHOTO_RULES);
      const ref = await putImage(blob);
      setError(null);
      const keep = photo ? { ...photo } : { ...DEFAULT_PHOTO };
      onChange({ ...DEFAULT_PHOTO, ...keep, src: URL.createObjectURL(blob), ref });
    } catch (cause) {
      setError(cause instanceof ImageError ? cause.message : 'That photo could not be read. Try another file.');
    } finally {
      setBusy(false);
    }
  };

  const choose = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PHOTO_RULES.types.join(',');
    input.addEventListener('change', () => void accept(input.files?.[0]), { once: true });
    input.click();
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  };

  const set = (patch: Partial<Photo>) => photo && onChange({ ...photo, ...patch });

  return (
    <div className="photo-style">
      {photo ? (
        <div className="logo-drop__current">
          <img src={photo.src} alt="Selected photo" />
          <span>
            <strong>Photo on</strong>
            <span>Stays on this device.</span>
          </span>
          <button type="button" className="icon-button" onClick={choose} aria-label="Replace photo" disabled={busy}>
            <Icon name="swap" size={18} />
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
            <strong>{busy ? 'Preparing photo…' : dragging ? 'Drop to use this photo' : 'Add a photo'}</strong>
            <span>Drag a photo here or click. PNG, JPG, WebP, GIF or AVIF up to 25 MB. Stays on this device.</span>
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

      {photo ? (
        <>
          <SegmentedField label="Blend" value={photo.mode} options={MODES} onChange={(mode) => set({ mode })} />

          {photo.mode === 'dots' ? (
            <div className="photo-style__group">
              <SliderField label="Dot size" value={photo.dotScale} min={25} max={80} unit="%" hint="Bigger dots scan more easily; smaller dots show more photo." onChange={(dotScale) => set({ dotScale })} />
              <SegmentedField label="Dot shape" value={photo.dotShape} options={SHAPES} onChange={(dotShape) => set({ dotShape })} />
              <SliderField label="Halo" value={photo.halo} min={0} max={100} unit="%" hint="A soft ring of the opposite ink, only where the photo needs it." onChange={(halo) => set({ halo })} />
              <SliderField label="Eye plate" value={photo.eyeOpacity} min={50} max={100} unit="%" hint="Opacity of the light plate behind the three corner eyes." onChange={(eyeOpacity) => set({ eyeOpacity })} />
              <SwitchField label="Rounded plate" checked={photo.plate} onChange={(plate) => set({ plate })} />
              {photo.plate ? <ColourField label="Border" value={photo.border} onChange={(border) => set({ border })} /> : null}
            </div>
          ) : (
            <div className="photo-style__group">
              <SliderField label="Photo strength" value={photo.strength} min={0} max={100} unit="%" hint="How much of the photo shows. Heavier photos are harder to scan." onChange={(strength) => set({ strength })} />
              <SliderField label="Contrast" value={photo.contrast} min={0} max={100} unit="%" hint="Raises the separation between dark and light modules." onChange={(contrast) => set({ contrast })} />
            </div>
          )}

          <div className="photo-style__group">
            <span className="field__label">Photo adjustments</span>
            <SliderField label="Readability" value={photo.readability} min={0} max={100} unit="%" hint="Pulls the photo's tones toward mid-grey so both inks stay visible." onChange={(readability) => set({ readability })} />
            <SliderField label="Brightness" value={photo.brightness} min={-50} max={50} onChange={(brightness) => set({ brightness })} />
            <SliderField label="Photo contrast" value={photo.photoContrast} min={-50} max={50} onChange={(photoContrast) => set({ photoContrast })} />
            <SliderField label="Saturation" value={photo.saturation} min={0} max={200} unit="%" onChange={(saturation) => set({ saturation })} />
          </div>

          <SegmentedField
            label="Detail"
            value={String(photo.detail)}
            options={DETAIL}
            hint="More detail adds modules for a sharper photo, but each module gets smaller."
            onChange={(detail) => set({ detail: Number(detail) })}
          />
          {payloadBytes > 40 || photo.detail >= 4 ? (
            <p className="photo-style__note">
              <Icon name="link" size={16} />
              <span>Long content makes a dense code that is harder to scan over a photo. A short link keeps the modules big.</span>
            </p>
          ) : null}
          <p className="photo-style__note">
            <Icon name="info" size={16} />
            <span>Error correction is at least Q while a photo is set (H is recommended), so the code can recover what the photo hides.</span>
          </p>
        </>
      ) : null}
    </div>
  );
}
