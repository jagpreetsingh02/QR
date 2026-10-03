import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { HistoryEntry } from '../types';
import { QR_TYPE_META } from '../lib/qrContent';
import { Icon } from '../components/Icon';

interface RecentCodesProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatRelative(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 45) return 'just now';
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, 'day');
  return new Date(timestamp).toLocaleDateString();
}

export function RecentCodes({ entries, activeId, onRestore, onRemove, onClear }: RecentCodesProps) {
  return (
    <section className="recent" aria-labelledby="recent-title">
      <div className="panel-head">
        <div>
          <h2 id="recent-title" className="panel-head__title">
            Recent codes
          </h2>
          <p className="panel-head__hint">Saved in this browser only.</p>
        </div>
        {entries.length > 0 ? (
          <button type="button" className="button button--ghost button--sm" onClick={onClear}>
            <Icon name="trash" size={16} />
            Clear all
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="recent__empty">
          <Icon name="history" size={22} />
          <span>Codes you make appear here and survive a refresh. Select one to bring back its content and design.</span>
        </p>
      ) : (
        <ul className="recent__grid">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <m.li
                key={entry.id}
                layout
                className="recent__item"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
              >
                <button
                  type="button"
                  className="recent__card"
                  data-type={entry.content.type}
                  aria-current={entry.id === activeId ? 'true' : undefined}
                  onClick={() => onRestore(entry)}
                >
                  {entry.thumbnail ? <img className="recent__thumb" src={entry.thumbnail} alt="" loading="lazy" /> : <span className="recent__thumb" />}
                  <span className="recent__label">{entry.label || 'Untitled'}</span>
                  <span className="recent__meta">
                    <span className="recent__badge">{QR_TYPE_META[entry.content.type].label}</span>
                    {formatRelative(entry.createdAt)}
                  </span>
                </button>
                <button type="button" className="recent__remove" aria-label={`Remove ${entry.label || 'code'} from recent codes`} onClick={() => onRemove(entry)}>
                  <Icon name="close" size={15} />
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
