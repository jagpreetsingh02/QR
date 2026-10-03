import { useMemo } from 'react';
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
 * A QR code drawn module by module. Only dark modules are rendered, each keyed
 * by its position: on first paint they assemble in a diagonal wave, and when
 * `text` changes only the cells that turn dark mount (and animate in) while
 * the ones that turn light disappear, so the code visibly morphs.
 */
export function MorphingCode({ text, version = 4, ecc = 'M', margin = 2, label, className }: MorphingCodeProps) {
  const grid = useMemo(() => moduleGrid(text, ecc, version), [text, ecc, version]);
  const cells = grid.length + margin * 2;

  return (
    <svg className={`morph-code${className ? ` ${className}` : ''}`} viewBox={`0 0 ${cells} ${cells}`} role="img" aria-label={label}>
      <rect className="morph-code__bg" width={cells} height={cells} />
      {grid.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect key={`${r}-${c}`} className="morph-code__cell" x={c + margin} y={r + margin} width={1} height={1} style={{ animationDelay: `${(r + c) * 9}ms` }} />
          ) : null,
        ),
      )}
    </svg>
  );
}
