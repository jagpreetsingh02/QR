import { useId, useState } from 'react';
import { isHexColour, normaliseHex } from '../lib/colour';

interface ColourFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

/**
 * Native colour swatch paired with a hex input. The text input keeps its own
 * draft so half-typed values such as `#1a7` never reset the preview.
 */
export function ColourField({ label, value, onChange }: ColourFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Re-sync during render when the colour changes elsewhere (preset, swap, restore).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = (next: string) => {
    setDraft(next);
    const candidate = next.startsWith('#') ? next : `#${next}`;
    if (isHexColour(candidate)) onChange(normaliseHex(candidate, value));
  };

  return (
    <div className="colour">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="colour__control">
        <input
          className="colour__swatch"
          type="color"
          value={value}
          aria-label={`${label} colour picker`}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          id={id}
          className="colour__hex"
          value={draft}
          spellCheck={false}
          maxLength={7}
          aria-label={`${label} hex value`}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => setDraft(value)}
        />
      </div>
    </div>
  );
}
