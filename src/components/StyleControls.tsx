import type { EccLevel, QrStyle } from '../types';
import { ColourField } from './ColourField';
import { LogoControl } from './LogoControl';
import { SegmentedField, SliderField } from './fields';
import { Icon } from './Icon';

interface StyleControlsProps {
  style: QrStyle;
  onChange: (patch: Partial<QrStyle>) => void;
}

const ECC_OPTIONS: ReadonlyArray<{ value: EccLevel; label: string; title: string }> = [
  { value: 'L', label: 'L', title: 'Low — recovers about 7% of the code' },
  { value: 'M', label: 'M', title: 'Medium — recovers about 15% of the code' },
  { value: 'Q', label: 'Q', title: 'Quartile — recovers about 25% of the code' },
  { value: 'H', label: 'H', title: 'High — recovers about 30% of the code' },
];

export function StyleControls({ style, onChange }: StyleControlsProps) {
  return (
    <div className="stack">
      <div className="colours">
        <ColourField label="Foreground" value={style.foreground} onChange={(foreground) => onChange({ foreground })} />
        <button
          type="button"
          className="btn btn--icon colour__swap"
          title="Swap foreground and background"
          aria-label="Swap foreground and background colours"
          onClick={() => onChange({ foreground: style.background, background: style.foreground })}
        >
          <Icon name="swap" size={16} />
        </button>
        <ColourField label="Background" value={style.background} onChange={(background) => onChange({ background })} />
      </div>

      <SliderField
        label="Size"
        value={style.size}
        min={128}
        max={1024}
        step={16}
        unit="px"
        hint="Applies to the preview and to every download."
        onChange={(size) => onChange({ size })}
      />

      <SliderField
        label="Margin (quiet zone)"
        value={style.margin}
        min={0}
        max={10}
        unit=" modules"
        hint="The QR specification recommends at least 4 modules."
        onChange={(margin) => onChange({ margin })}
      />

      <SegmentedField
        label="Error correction"
        value={style.ecc}
        options={ECC_OPTIONS}
        hint="Higher levels survive damage and logos, but make the code denser."
        onChange={(ecc) => onChange({ ecc })}
      />

      <LogoControl
        logo={style.logo}
        logoScale={style.logoScale}
        onLogoChange={(logo) => onChange({ logo })}
        onScaleChange={(logoScale) => onChange({ logoScale })}
      />
    </div>
  );
}
