import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
import { QrSvg } from '../../components/QrSvg';
import { QR_TYPES } from '../../types';
import { QR_TYPE_META } from '../../lib/qrContent';
import { PRESETS } from '../../lib/presets';
import { Reveal } from '../Reveal';

const DEMO = 'https://gdg.community.dev';

/** The studio's own pieces, miniaturised, so each step shows what you will actually touch. */
export function HowItWorks() {
  return (
    <section className="lp-section lp-how" aria-labelledby="how-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="how-title" className="type-display-l">
            From idea to printed code in about thirty seconds.
          </h2>
        </Reveal>
        <ol className="lp-flow">
          <li className="lp-flow__step">
            <div className="lp-flow__visual" aria-hidden="true">
              <div className="lp-flow__types">
                {QR_TYPES.map((t) => (
                  <span key={t} className="lp-flow__type" data-type={t}>
                    <Icon name={QR_TYPE_META[t].icon as IconName} size={16} />
                  </span>
                ))}
              </div>
              <span className="lp-flow__field">gdg.community.dev</span>
            </div>
            <h3 className="type-title-l">Pick a type and fill it in</h3>
            <p>Mistakes are flagged as you type, in plain language, before they end up in the code.</p>
          </li>
          <li className="lp-flow__step">
            <div className="lp-flow__visual" aria-hidden="true">
              <div className="lp-flow__presets">
                {PRESETS.slice(0, 3).map((p) => (
                  <QrSvg key={p.id} className="lp-flow__preset" text={DEMO} foreground={p.foreground} background={p.background} margin={2} />
                ))}
              </div>
              <span className="lp-flow__verdict">
                <Icon name="check-circle" size={16} /> No scan risks
              </span>
            </div>
            <h3 className="type-title-l">Design it and read the scan check</h3>
            <p>Presets, colours, size, quiet zone, error correction and a logo, with risky choices flagged as you make them.</p>
          </li>
          <li className="lp-flow__step">
            <div className="lp-flow__visual" aria-hidden="true">
              <span className="lp-flow__file">
                <Icon name="image" size={16} /> qr-url-gdg-community-dev.png
              </span>
              <span className="lp-flow__file">
                <Icon name="download" size={16} /> qr-url-gdg-community-dev.svg
              </span>
            </div>
            <h3 className="type-title-l">Download PNG or SVG</h3>
            <p>The PNG is the exact pixels of the preview; the SVG is the same geometry, lossless for print.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
