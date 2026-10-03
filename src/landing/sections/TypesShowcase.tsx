import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import * as m from 'motion/react-m';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
import { MorphingCode } from '../../components/MorphingCode';
import { QR_TYPE_META } from '../../lib/qrContent';
import { Reveal } from '../Reveal';
import { SAMPLES, encoded } from '../samples';

/** Highlights the scheme and the escaped characters of a payload. */
function Payload({ value }: { value: string }) {
  const scheme = value.match(/^(https?:\/\/|mailto:|tel:|WIFI:)/)?.[0] ?? '';
  const rest = value.slice(scheme.length);
  const parts = rest.split(/(\\[;,:"\\]|%20)/g);
  return (
    <code className="payload lp-types__payload">
      {scheme ? <span className="tok-scheme">{scheme}</span> : null}
      {parts.map((part, i) =>
        /^(\\[;,:"\\]|%20)$/.test(part) ? (
          <mark key={i} className="tok-escape">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </code>
  );
}

export function TypesShowcase() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const sample = SAMPLES[active];
  const value = encoded(sample);

  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = active;
    if (event.key in keys) next = (active + keys[event.key] + SAMPLES.length) % SAMPLES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SAMPLES.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="lp-section lp-types" id="types" aria-labelledby="types-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="types-title" className="type-display-l">
            Five types. Each one encoded to spec.
          </h2>
          <p className="type-body-l">
            A code that scans but does the wrong thing is worse than no code. Pick a type to see the exact string that ends
            up inside the code.
          </p>
        </Reveal>

        <div className="lp-types__tabs" role="tablist" aria-label="QR code types" onKeyDown={onKeyDown}>
          {SAMPLES.map((s, i) => (
            <button
              key={s.type}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`type-tab-${s.type}`}
              aria-selected={i === active}
              aria-controls="type-panel"
              tabIndex={i === active ? 0 : -1}
              className="lp-types__tab"
              data-type={s.type}
              onClick={() => setActive(i)}
            >
              {i === active ? <m.span layoutId="type-pill" className="lp-types__pill" /> : null}
              <Icon name={QR_TYPE_META[s.type].icon as IconName} size={18} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="lp-types__panel" role="tabpanel" id="type-panel" aria-labelledby={`type-tab-${sample.type}`} data-type={sample.type}>
          <div className="lp-types__input">
            <p className="lp-label">What you type</p>
            <dl className="lp-types__fields">
              {sample.fields.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="lp-label">What gets encoded</p>
            <Payload value={value} />
            <p className="lp-types__detail">{sample.detail}</p>
          </div>
          <div className="lp-types__code">
            <MorphingCode text={value} label={`QR code for the ${sample.label} example`} />
          </div>
        </div>
      </div>
    </section>
  );
}
