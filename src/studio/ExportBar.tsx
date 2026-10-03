import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';

interface ExportBarProps {
  disabled: boolean;
  onPng: () => Promise<boolean>;
  onSvg: () => Promise<boolean>;
  onCopy?: () => Promise<boolean>;
}

type Done = 'png' | 'svg' | 'copy' | null;

/** Primary PNG, secondary SVG; each button confirms success in place for a moment. */
export function ExportBar({ disabled, onPng, onSvg, onCopy }: ExportBarProps) {
  const [done, setDone] = useState<Done>(null);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(null), 1600);
    return () => window.clearTimeout(timer);
  }, [done]);

  const run = (kind: Exclude<Done, null>, action: () => Promise<boolean>) => async () => {
    if (await action()) setDone(kind);
  };

  return (
    <div className="export-bar" role="group" aria-label="Download">
      <button type="button" className="button button--primary export-bar__primary" disabled={disabled} onClick={run('png', onPng)}>
        <Icon name={done === 'png' ? 'check' : 'download'} size={19} />
        {done === 'png' ? 'Saved' : 'Download PNG'}
      </button>
      <button type="button" className="button button--secondary" disabled={disabled} onClick={run('svg', onSvg)} aria-label={done === 'svg' ? 'SVG saved' : 'Download SVG'}>
        <Icon name={done === 'svg' ? 'check' : 'download'} size={19} />
        <span aria-hidden="true">{done === 'svg' ? 'Saved' : 'SVG'}</span>
      </button>
      {onCopy ? (
        <button type="button" className="button button--ghost" disabled={disabled} onClick={run('copy', onCopy)} aria-label={done === 'copy' ? 'Image copied' : 'Copy image'}>
          <Icon name={done === 'copy' ? 'check' : 'copy'} size={19} />
          <span className="export-bar__copy-label" aria-hidden="true">
            {done === 'copy' ? 'Copied' : 'Copy'}
          </span>
        </button>
      ) : null}
    </div>
  );
}
