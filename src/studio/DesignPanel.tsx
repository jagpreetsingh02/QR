import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { EccLevel, PhotoStyle as Photo, QrStyle } from '../types';
import { contrastRatio } from '../lib/colour';
import { MIN_SAFE_CONTRAST } from '../lib/scanAdvice';
import { PRESETS, matchPreset } from '../lib/presets';
import type { Preset } from '../lib/presets';
import { ColourField } from '../components/ColourField';
import { SegmentedField, SliderField } from '../components/fields';
import { Icon } from '../components/Icon';
import { QrSvg } from '../components/QrSvg';
import { LogoDrop } from './LogoDrop';
import { PhotoStyle } from './PhotoStyle';
import { atLeastQ } from '../lib/photo';

const ECC_OPTIONS: ReadonlyArray<{ value: EccLevel; label: string; detail: string; title: string }> = [
  { value: 'L', label: 'L', detail: '7%', title: 'Low: recovers about 7% of the code' },
  { value: 'M', label: 'M', detail: '15%', title: 'Medium: recovers about 15% of the code' },
  { value: 'Q', label: 'Q', detail: '25%', title: 'Quartile: recovers about 25% of the code' },
  { value: 'H', label: 'H', detail: '30%', title: 'High: recovers about 30% of the code' },
];

interface DesignPanelProps {
  style: QrStyle;
  /** Payload used for the preset previews (the current code, or a sample). */
  previewText: string;
  onChange: (patch: Partial<QrStyle>) => void;
  onPreset: (preset: Preset) => void;
  onReset: () => void;
  /** Note shown after restoring a recent code that had a photo. */
  photoNote: string | null;
  onPhoto: (photo: Photo | null) => void;
  payloadBytes: number;
}

type Tab = 'style' | 'photo';
const TABS: Array<[Tab, string]> = [
  ['style', 'Style'],
  ['photo', 'Photo'],
];

export function DesignPanel({ style, previewText, onChange, onPreset, onReset, photoNote, onPhoto, payloadBytes }: DesignPanelProps) {
  const [tab, setTab] = useState<Tab>('style');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = TABS[(TABS.findIndex(([id]) => id === tab) + 1) % TABS.length][0];
    setTab(next);
    tabRefs.current[TABS.findIndex(([id]) => id === next)]?.focus();
  };
  const active = matchPreset(style);
  const ratio = contrastRatio(style.foreground, style.background);
  const ratioStatus = ratio >= MIN_SAFE_CONTRAST ? 'ok' : ratio >= 3 ? 'warn' : 'bad';

  return (
    <section className="panel design-panel" aria-labelledby="design-title">
      <div className="panel-head">
        <h2 id="design-title" className="panel-head__title">
          Design
        </h2>
        <button type="button" className="button button--ghost button--sm" onClick={onReset}>
          <Icon name="restore" size={16} />
          Reset
        </button>
      </div>

      <div className="panel-tabs" role="tablist" aria-label="Design sections" onKeyDown={onTabKey}>
        {TABS.map(([id, label], i) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`design-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`design-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className="panel-tabs__tab"
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'photo' && style.photo ? <span className="panel-tabs__badge">On</span> : null}
          </button>
        ))}
      </div>

      <div className="panel-tabpanel" role="tabpanel" id="design-panel-style" aria-labelledby="design-tab-style" hidden={tab !== 'style'}>
      <div className="panel-group">
        <span className="field__label" id="presets-label">
          Presets
        </span>
        <div className="presets" role="group" aria-labelledby="presets-label">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="preset"
              aria-pressed={active?.id === p.id}
              onClick={() => onPreset(p)}
            >
              <QrSvg className="preset__code" text={previewText} foreground={p.foreground} background={p.background} margin={2} ecc={style.ecc} />
              <span className="preset__name">{p.name}</span>
              <span className="preset__ratio">{contrastRatio(p.foreground, p.background).toFixed(1)}:1</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-group">
        <div className="colour-pair">
          <ColourField label="Foreground" value={style.foreground} onChange={(foreground) => onChange({ foreground })} />
          <button
            type="button"
            className="icon-button colour-pair__swap"
            title="Swap colours"
            aria-label="Swap foreground and background colours"
            onClick={() => onChange({ foreground: style.background, background: style.foreground })}
          >
            <Icon name="swap" size={18} />
          </button>
          <ColourField label="Background" value={style.background} onChange={(background) => onChange({ background })} />
        </div>
        <p className="contrast-readout" data-status={ratioStatus} aria-live="polite">
          <span className="contrast-readout__value">{ratio.toFixed(1)}:1</span>
          <span>
            {ratioStatus === 'ok'
              ? 'contrast, comfortably scannable'
              : ratioStatus === 'warn'
                ? `contrast, below ${MIN_SAFE_CONTRAST}:1, may fail in poor light`
                : 'contrast, most scanners will not read this'}
          </span>
        </p>
      </div>

      <div className="panel-group">
        <SliderField label="Size" value={style.size} min={128} max={1024} step={16} unit=" px" hint="Used by the preview and every download." onChange={(size) => onChange({ size })} />
        <SliderField label="Quiet zone" value={style.margin} min={0} max={10} unit=" modules" hint="The blank border scanners look for. The QR spec asks for 4." onChange={(margin) => onChange({ margin })} />
        <SegmentedField
          label="Error correction"
          value={style.photo ? atLeastQ(style.ecc) : style.ecc}
          options={style.photo ? ECC_OPTIONS.map((o) => ({ ...o, disabled: o.value === 'L' || o.value === 'M' })) : ECC_OPTIONS}
          hint={style.photo ? 'A photo style needs at least Q, so L and M are off while a photo is set.' : 'How much of the code can be damaged or covered and still scan.'}
          onChange={(ecc) => onChange({ ecc })}
        />
      </div>

      <div className="panel-group">
        <span className="field__label">Logo</span>
        <LogoDrop logo={style.logo} logoScale={style.logoScale} onLogoChange={(logo, ref) => onChange({ logo, logoRef: ref ?? null })} onScaleChange={(logoScale) => onChange({ logoScale })} />
      </div>

      </div>

      <div className="panel-tabpanel" role="tabpanel" id="design-panel-photo" aria-labelledby="design-tab-photo" hidden={tab !== 'photo'}>
        <PhotoStyle photo={style.photo} note={photoNote} payloadBytes={payloadBytes} onChange={onPhoto} />
      </div>
    </section>
  );
}
