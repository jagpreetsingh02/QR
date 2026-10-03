import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { QrStyle, ScanWarning } from '../types';
import { contrastRatio } from '../lib/colour';
import { MIN_SAFE_CONTRAST } from '../lib/scanAdvice';
import { Icon } from '../components/Icon';

const RECOVERY: Record<QrStyle['ecc'], string> = { L: '7%', M: '15%', Q: '25%', H: '30%' };
type Status = 'ok' | 'warn' | 'bad';

function Reading({ label, value, status }: { label: string; value: string; status: Status }) {
  return (
    <div className="reading" data-status={status}>
      <dt>{label}</dt>
      <dd>
        <span className="reading__dot" aria-hidden="true" />
        {value}
        <span className="visually-hidden">{status === 'ok' ? ' (good)' : status === 'warn' ? ' (risky)' : ' (likely to fail)'}</span>
      </dd>
    </div>
  );
}

interface ScanCheckProps {
  style: QrStyle;
  warnings: ScanWarning[];
  active: boolean;
}

/** The advisor: real measurements first, then guidance ranked by severity. */
export function ScanCheck({ style, warnings, active }: ScanCheckProps) {
  const ratio = contrastRatio(style.foreground, style.background);
  const ranked = [...warnings].sort((a, b) => (a.level === b.level ? 0 : a.level === 'warning' ? -1 : 1));
  const clear = active && warnings.length === 0;

  return (
    <section className="scan-check" aria-labelledby="scan-check-title">
      <div className="panel-head">
        <h2 id="scan-check-title" className="panel-head__title">
          Scan check
        </h2>
        <p className="panel-head__hint">Advice only. Downloads are never blocked.</p>
      </div>

      <dl className="scan-check__readings">
        <Reading label="Contrast" value={`${ratio.toFixed(1)}:1`} status={ratio >= MIN_SAFE_CONTRAST ? 'ok' : ratio >= 3 ? 'warn' : 'bad'} />
        <Reading label="Quiet zone" value={`${style.margin} mod`} status={style.margin >= 4 ? 'ok' : style.margin > 0 ? 'warn' : 'bad'} />
        <Reading label="Size" value={`${style.size} px`} status={style.size >= 200 ? 'ok' : 'warn'} />
        <Reading label="Recovers" value={`${RECOVERY[style.ecc]} · ${style.ecc}`} status={style.logo && (style.ecc === 'L' || style.ecc === 'M') ? 'warn' : 'ok'} />
      </dl>

      <div aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {clear ? (
            <m.p key="clear" className="scan-check__clear" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <svg className="scan-check__tick" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m7.5 12.4 3 3 6-6.4" />
              </svg>
              <span>
                <strong>No scan risks found.</strong> Contrast, quiet zone and size are all in a comfortable range.
              </span>
            </m.p>
          ) : null}
        </AnimatePresence>
        <ul className="scan-check__list">
          <AnimatePresence initial={false}>
            {active
              ? ranked.map((w) => (
                  <m.li
                    key={w.id}
                    layout
                    className="advice"
                    data-level={w.level}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, paddingBlock: 0 }}
                  >
                    <Icon name={w.level === 'warning' ? 'alert' : 'info'} size={18} />
                    <span>
                      <span className="visually-hidden">{w.level === 'warning' ? 'Warning: ' : 'Note: '}</span>
                      {w.message}
                    </span>
                  </m.li>
                ))
              : null}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
