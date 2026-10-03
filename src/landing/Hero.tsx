import { useState } from 'react';
import { Link } from '../Link';
import { Icon } from '../components/Icon';
import { MorphingCode } from '../components/MorphingCode';
import { HERO_SAMPLES, encoded } from './samples';
import { useCycle, usePrefersReducedMotion, useTypewriter } from './hooks';

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [index] = useCycle(HERO_SAMPLES.length, 4200, paused || reduced);
  const sample = HERO_SAMPLES[index];
  const payload = encoded(sample);
  const typed = useTypewriter(payload, reduced);

  return (
    <section className="lp-hero" aria-labelledby="hero-title">
      <div className="container lp-hero__grid">
        <div className="lp-hero__copy">
          <h1 id="hero-title" className="type-display-xl">
            QR codes that <span className="lp-hero__accent">actually scan.</span>
          </h1>
          <p className="lp-hero__lede type-body-l">
            Design a code for your poster, Wi-Fi or resume in seconds. Every payload is encoded to spec, every design is
            checked before it fails, and nothing ever leaves your device.
          </p>
          <div className="lp-hero__ctas">
            <Link to="/studio" className="button button--primary button--lg">
              Create a QR code
              <Icon name="arrow-right" size={20} />
            </Link>
            <a href="#scan-check" className="button button--secondary button--lg">
              See how it scans
            </a>
          </div>
        </div>

        <div
          className="lp-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <span className="lp-shape lp-shape--squircle" aria-hidden="true" />
          <span className="lp-shape lp-shape--ring" aria-hidden="true" />
          <span className="lp-shape lp-shape--pill" aria-hidden="true" />
          <span className="lp-shape lp-shape--dot" aria-hidden="true" />

          <figure className="lp-stage__plate" tabIndex={0} aria-label={`Live ${sample.label} QR code. Hover or focus to pause.`}>
            <MorphingCode text={payload} label={`QR code encoding a ${sample.label} payload`} />
            {!reduced ? <span className="lp-stage__scan" aria-hidden="true" /> : null}
          </figure>

          <p className="lp-stage__payload" aria-live="polite">
            <span className="lp-stage__type">{sample.label}</span>
            <code className="payload" aria-label={payload}>
              <span aria-hidden="true">
                {typed}
                <span className="lp-caret" />
              </span>
            </code>
          </p>
        </div>
      </div>
    </section>
  );
}
