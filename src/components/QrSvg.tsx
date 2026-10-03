import { useMemo } from 'react';
import type { EccLevel } from '../types';
import { buildMatrix } from '../lib/render';

interface QrSvgProps {
  text: string;
  foreground: string;
  background: string;
  margin?: number;
  ecc?: EccLevel;
  className?: string;
  title?: string;
}

/**
 * Lightweight static QR rendering for swatches and demos. Uses the same
 * module matrix as the studio renderer, drawn as one SVG path.
 */
export function QrSvg({ text, foreground, background, margin = 2, ecc = 'M', className, title }: QrSvgProps) {
  const { cells, d } = useMemo(() => {
    try {
      const m = buildMatrix(text, ecc);
      let path = '';
      for (let r = 0; r < m.size; r += 1) {
        for (let c = 0; c < m.size; c += 1) if (m.get(r, c)) path += `M${c + margin} ${r + margin}h1v1h-1z`;
      }
      return { cells: m.size + margin * 2, d: path };
    } catch {
      return { cells: 21, d: '' };
    }
  }, [text, ecc, margin]);

  return (
    <svg className={className} viewBox={`0 0 ${cells} ${cells}`} shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width={cells} height={cells} fill={background} />
      <path d={d} fill={foreground} />
    </svg>
  );
}
