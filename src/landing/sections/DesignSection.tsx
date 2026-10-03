import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { QrSvg } from '../../components/QrSvg';
import { contrastRatio } from '../../lib/colour';
import { PRESETS } from '../../lib/presets';
import { MIN_SAFE_CONTRAST } from '../../lib/scanAdvice';
import { Reveal } from '../Reveal';

const DEMO_TEXT = 'https://gdg.community.dev';

export function DesignSection() {
  const [fg, setFg] = useState('#174ea6');
  const [bg, setBg] = useState('#e8f0fe');
  const ratio = contrastRatio(fg, bg);
  const safe = ratio >= MIN_SAFE_CONTRAST;

  return (
    <section className="lp-section lp-design" id="design" aria-labelledby="design-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="design-title" className="type-display-l">
            Make it yours. Keep it scannable.
          </h2>
          <p className="type-body-l">
            Start from a preset, then change anything. Every preset below is a real code, and each one clears the 4.5:1
            contrast the scan check asks for.
          </p>
        </Reveal>
      </div>

      <ul className="lp-presets" aria-label="Presets">
        {PRESETS.map((p) => (
          <li key={p.id} className="lp-preset">
            <QrSvg className="lp-preset__code" text={DEMO_TEXT} foreground={p.foreground} background={p.background} margin={p.margin} />
            <span className="lp-preset__name">{p.name}</span>
            <span className="lp-preset__ratio">{contrastRatio(p.foreground, p.background).toFixed(1)}:1</span>
          </li>
        ))}
      </ul>

      <div className="container">
        <div className="lp-colour-demo">
          <div className="lp-colour-demo__controls">
            <h3 className="type-title-l">Try a colour pair</h3>
            <p className="type-body-m">The code and its contrast ratio update as you pick.</p>
            <div className="lp-colour-demo__pickers">
              <label className="lp-picker">
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
                <span>
                  Foreground <code>{fg}</code>
                </span>
              </label>
              <button
                type="button"
                className="icon-button"
                aria-label="Swap colours"
                onClick={() => {
                  setFg(bg);
                  setBg(fg);
                }}
              >
                <Icon name="swap" size={18} />
              </button>
              <label className="lp-picker">
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
                <span>
                  Background <code>{bg}</code>
                </span>
              </label>
            </div>
            <p className={`lp-ratio ${safe ? 'is-safe' : 'is-risky'}`} aria-live="polite">
              <span className="lp-ratio__value">{ratio.toFixed(1)}:1</span>
              <span>{safe ? 'Comfortably scannable' : `Below ${MIN_SAFE_CONTRAST}:1. Expect a warning in the studio.`}</span>
            </p>
          </div>
          <div className="lp-colour-demo__code">
            <QrSvg text={DEMO_TEXT} foreground={fg} background={bg} margin={3} title={`QR code in ${fg} on ${bg}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
