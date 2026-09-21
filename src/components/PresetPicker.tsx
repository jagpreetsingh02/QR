import { PRESETS, matchPreset } from '../lib/presets';
import type { Preset, PresetStyle } from '../lib/presets';

interface PresetPickerProps {
  style: PresetStyle;
  onApply: (preset: Preset) => void;
}

export function PresetPicker({ style, onApply }: PresetPickerProps) {
  const active = matchPreset(style);

  return (
    <div className="presets">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="preset"
          aria-pressed={active?.id === preset.id}
          onClick={() => onApply(preset)}
        >
          <span className="preset__chip" style={{ background: preset.background }}>
            <span style={{ background: preset.foreground }} />
          </span>
          <span className="preset__name">{preset.name}</span>
        </button>
      ))}
    </div>
  );
}
