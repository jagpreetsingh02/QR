import { useEffect, useMemo, useState } from 'react';
import type { EccLevel } from '../types';
import { moduleGrid } from '../lib/render';

interface MorphingCodeProps {
  text: string;
  /** All payloads shown by one instance must fit this version so the grid size stays fixed. */
  version?: number;
  ecc?: EccLevel;
  margin?: number;
  label: string;
  className?: string;
}

/**
 * A QR code drawn module by module. On mount the modules assemble in a
 * diagonal wave; when `text` changes, only the cells that differ flip, so the
 * code visibly morphs into the new payload. CSS owns the motion and turns it
 * off under prefers-reduced-motion.
 */
export function MorphingCode({ text, version = 4, ecc = 'M', margin = 2, label, className }: MorphingCodeProps) {
  const grid = useMemo(() => moduleGrid(text, ecc, version), [text, ecc, version]);
  const [assembled, setAssembled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAssembled(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  const size = grid.length;
  const cells = size + margin * 2;

  return (
    <svg
      className={`morph-code${assembled ? ' is-assembled' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label={label}
    >
      <rect className="morph-code__bg" width={cells} height={cells} />
      {grid.map((row, r) =>
        row.map((on, c) => (
          <rect
            key={`${r}-${c}`}
            className={on ? 'morph-code__cell is-on' : 'morph-code__cell'}
            x={c + margin}
            y={r + margin}
            width={1}
            height={1}
            style={{ transitionDelay: `${(r + c) * 9}ms` }}
          />
        )),
      )}
    </svg>
  );
}
