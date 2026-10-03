import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { QrSvg } from '../../components/QrSvg';
import { contrastRatio, hexToRgb } from '../../lib/colour';
import { DEFAULT_STYLE } from '../../lib/presets';
import { getScanWarnings } from '../../lib/scanAdvice';
import { Reveal } from '../Reveal';
import { SAMPLES, encoded } from '../samples';

// The escaped Wi-Fi payload from the types showcase, encoded by the studio's encoder.
const PAYLOAD = encoded(SAMPLES.find((s) => s.type === 'wifi')!);
const INK = '#141927';
const PAPER = '#ffffff';

/** Mixes the ink towards the paper: 0 = full ink, 100 = invisible. */
function fade(amount: number): string {
  const a = hexToRgb(INK)!;
  const b = hexToRgb(PAPER)!;
  const t = amount / 100;
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${mix(a.r, b.r)}${mix(a.g, b.g)}${mix(a.b, b.b)}`;
}

export function ScanSection() {
  const [washout, setWashout] = useState(0);
  const [margin, setMargin] = useState(4);
  const foreground = fade(washout);
  const ratio = contrastRatio(foreground, PAPER);

  // The studio's own advisor, fed the demo's settings.
  const warnings = getScanWarnings({ ...DEFAULT_STYLE, size: 512, foreground, background: PAPER, margin }, PAYLOAD);

  return (
    <section className="lp-section lp-scan" id="scan-check" aria-labelledby="scan-title">
      <div className="container lp-scan__grid">
        <div className="lp-scan__copy">
          <Reveal>
            <h2 id="scan-title" className="type-display-l">
              We tell you before it fails.
            </h2>
            <p className="type-body-l">
              Washed-out colours and a missing quiet zone are the two most common reasons a printed code will not scan.
              Drag the sliders and watch the same advisor the studio uses respond with real numbers.
            </p>
          </Reveal>

          <div className="lp-scan__controls">
            <div className="lp-slider">
              <div className="lp-slider__head">
                <label htmlFor="scan-fade">Fade the ink</label>
                <output htmlFor="scan-fade">{ratio.toFixed(1)}:1 contrast</output>
              </div>
              <input id="scan-fade" type="range" min={0} max={92} value={washout} onChange={(e) => setWashout(Number(e.target.value))} />
            </div>
            <div className="lp-slider">
              <div className="lp-slider__head">
                <label htmlFor="scan-margin">Quiet zone</label>
                <output htmlFor="scan-margin">
                  {margin} module{margin === 1 ? '' : 's'}
                </output>
              </div>
              <input id="scan-margin" type="range" min={0} max={6} value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
            </div>
          </div>

          <ul className="lp-advice" aria-live="polite" aria-label="Scan check results">
            {warnings.length === 0 ? (
              <li className="lp-advice__item is-ok">
                <Icon name="check-circle" size={20} />
                <span>No scan risks found at {ratio.toFixed(1)}:1 contrast with a {margin}-module quiet zone.</span>
              </li>
            ) : (
              warnings.map((w) => (
                <li key={w.id} className={`lp-advice__item is-${w.level}`}>
                  <Icon name={w.level === 'warning' ? 'alert' : 'info'} size={20} />
                  <span>{w.message}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="lp-scan__stage">
          <div className="lp-scan__frame" data-margin={margin}>
            <QrSvg text={PAYLOAD} foreground={foreground} background={PAPER} margin={margin} title={`Demo QR code at ${ratio.toFixed(1)} to 1 contrast`} />
          </div>
          <p className="lp-scan__caption">Downloads are never blocked; the choice stays yours.</p>
        </div>
      </div>
    </section>
  );
}
