import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { QrStyle, ScanWarning } from '../types';
import { Icon } from '../components/Icon';
import { getReadings } from './readings';
import type { Status } from './readings';

const STATUS_ICON = { ok: 'check', warn: 'alert', bad: 'close' } as const;

function Reading({ label, value, status }: { label: string; value: string; status: Status }) {
  return (
    <div className="reading" data-status={status}>
      <dt>{label}</dt>
      <dd>
        <span className="reading__mark" aria-hidden="true">
          <Icon name={STATUS_ICON[status]} size={12} />
        </span>
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
  /** Photo styles only: result of decoding the rendered canvas in this browser. */
  decode?: 'pending' | 'pass' | 'fail' | null;
  onBoost?: () => void;
  boosting?: boolean;
}

/** The advisor: real measurements first, then guidance ranked by severity. */
export function ScanCheck({ style, warnings, active, decode = null, onBoost, boosting = false }: ScanCheckProps) {
  const ranked = [...warnings].sort((a, b) => (a.level === b.level ? 0 : a.level === 'warning' ? -1 : 1));
  const clear = active && warnings.length === 0 && decode !== 'fail' && decode !== 'pending';

  return (
    <section className="scan-check" id="scan-check" aria-labelledby="scan-check-title" tabIndex={-1}>
      <div className="panel-head">
        <h2 id="scan-check-title" className="panel-head__title">
          Scan check
        </h2>
        <p className="panel-head__hint">Advice only. Downloads are never blocked.</p>
      </div>

      <dl className="scan-check__readings">
        {getReadings(style).map((r) => (
          <Reading key={r.label} {...r} />
        ))}
      </dl>

      <div aria-live="polite">
        {active && decode ? (
          <div className="decode" data-status={decode}>
            <Icon name={decode === 'pass' ? 'check-circle' : decode === 'fail' ? 'alert' : 'scan'} size={18} />
            <span>
              {decode === 'pass' ? (
                <>
                  <strong>Test scan passed.</strong> This browser decoded the photo style back to your exact content.
                </>
              ) : decode === 'fail' ? (
                <>
                  <strong>Test scan failed.</strong> The photo hides too much for a reliable read.
                </>
              ) : (
                <>Test-scanning the photo style…</>
              )}
            </span>
            {decode === 'fail' && onBoost ? (
              <button type="button" className="button button--primary button--sm decode__boost" onClick={onBoost} disabled={boosting}>
                <Icon name="sparkle" size={16} />
                {boosting ? 'Boosting…' : 'Boost readability'}
              </button>
            ) : null}
          </div>
        ) : null}
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
