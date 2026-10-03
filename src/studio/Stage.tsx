import { useState } from 'react';
import type { RefObject } from 'react';
import type { QrContent, QrStyle } from '../types';
import { QR_TYPE_META } from '../lib/qrContent';
import { payloadBytes } from '../lib/validation';
import { Icon } from '../components/Icon';
import { maskPayload } from './payload';

interface StageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  style: QrStyle;
  content: QrContent;
  encoded: string;
  isRendered: boolean;
  renderError: string | null;
  formMessage: string | null;
}

/** A ghost code: drawn absence for the empty and error states. */
function GhostModules() {
  return (
    <svg className="stage__ghost" viewBox="0 0 21 21" aria-hidden="true">
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.4} fill="none" strokeWidth={1} />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} />
        </g>
      ))}
      {[8, 10, 12].map((x) => [8, 10, 12, 15, 17].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} rx={0.2} />))}
    </svg>
  );
}

export function Stage({ canvasRef, style, content, encoded, isRendered, renderError, formMessage }: StageProps) {
  const [reveal, setReveal] = useState(false);
  const label = QR_TYPE_META[content.type].label;
  const shown = reveal ? encoded : maskPayload(encoded, content);
  const masked = shown !== encoded;

  return (
    <section className="stage" aria-labelledby="stage-title">
      <h2 id="stage-title" className="visually-hidden">
        Preview
      </h2>
      <div className="stage__surface" data-state={renderError ? 'error' : isRendered ? 'ready' : 'empty'}>
        <div className="stage__plate">
          {/* The canvas stays mounted so its ref exists before the first render; the PNG download is taken from it. */}
          <canvas ref={canvasRef} className="stage__canvas" role="img" aria-label={`${label} QR code preview`} hidden={!isRendered} />
          {!isRendered ? (
            <div className="stage__empty">
              <GhostModules />
              <p className="stage__empty-title">{renderError ? 'This content does not fit' : 'Your code appears here'}</p>
              <p className="stage__empty-body">{renderError ?? formMessage ?? 'Fill in the details to generate it.'}</p>
            </div>
          ) : null}
        </div>
      </div>

      {isRendered ? (
        <div className="stage__meta">
          <dl className="stage__facts">
            <div>
              <dt>Type</dt>
              <dd>{label}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{style.size} px</dd>
            </div>
            <div>
              <dt>Payload</dt>
              <dd>{payloadBytes(encoded)} bytes</dd>
            </div>
          </dl>
          <div className="stage__payload">
            <code className="payload" aria-label={masked ? 'Encoded payload, password hidden' : 'Encoded payload'}>
              {shown}
            </code>
            {content.type === 'wifi' && content.password && content.encryption !== 'nopass' ? (
              <button type="button" className="stage__reveal" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
                <Icon name={reveal ? 'lock' : 'scan'} size={16} />
                {reveal ? 'Hide password' : 'Show password'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
