import type { HistoryEntry } from '../types';
import { QR_TYPE_META } from '../lib/qrContent';
import { Icon } from './Icon';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60_000],
  ['minute', 3_600_000],
  ['hour', 86_400_000],
  ['day', 604_800_000],
];

function formatRelative(timestamp: number): string {
  const diff = timestamp - Date.now();
  const magnitude = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (magnitude < 45_000) return 'just now';
  for (const [unit, limit] of RELATIVE_UNITS) {
    if (magnitude < limit) {
      const divisor = limit / (unit === 'second' ? 1000 : unit === 'minute' ? 60 : unit === 'hour' ? 24 : 7);
      return formatter.format(Math.round(diff / divisor), unit);
    }
  }
  return new Date(timestamp).toLocaleDateString();
}

export function HistoryPanel({ entries, activeId, onRestore, onRemove, onClear }: HistoryPanelProps) {
  return (
    <section className="card" aria-labelledby="history-title">
      <div className="card__header">
        <span className="card__step" aria-hidden="true">
          <Icon name="restore" size={14} />
        </span>
        <div className="card__headings">
          <h2 className="card__title" id="history-title">
            Recent codes
          </h2>
          <p className="card__hint">Saved in this browser only. Select one to restore its data and design.</p>
        </div>
        {entries.length > 0 ? (
          <button type="button" className="btn btn--ghost btn--sm card__action" onClick={onClear}>
            <Icon name="trash" size={14} />
            Clear all
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="empty">
          <Icon name="restore" size={20} />
          Codes you generate are listed here and survive a page refresh.
        </p>
      ) : (
        <ul className="history__grid">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="history__item"
                aria-current={entry.id === activeId ? 'true' : undefined}
                onClick={() => onRestore(entry)}
                title={entry.label}
              >
                <img className="history__thumb" src={entry.thumbnail} alt="" loading="lazy" />
                <span className="history__label">{entry.label || 'Untitled'}</span>
                <span className="history__meta">
                  <span className="history__badge">{QR_TYPE_META[entry.content.type].label}</span>
                  {formatRelative(entry.createdAt)}
                </span>
              </button>
              <button
                type="button"
                className="history__remove"
                aria-label={`Remove ${entry.label || 'entry'} from recent codes`}
                onClick={() => onRemove(entry.id)}
              >
                <Icon name="close" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
