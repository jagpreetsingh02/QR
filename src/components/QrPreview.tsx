import type { RefObject } from 'react';
import type { QrStyle, ScanWarning } from '../types';
import { contrastRatio } from '../lib/colour';
import { Callout } from './Callout';
import { Icon } from './Icon';

interface QrPreviewProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  style: QrStyle;
  encoded: string;
  /** True when the form is valid and the canvas shows the current settings. */
  isRendered: boolean;
  renderError: string | null;
  formMessage: string | null;
  warnings: ScanWarning[];
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
}

export function QrPreview({
  canvasRef,
  style,
  encoded,
  isRendered,
  renderError,
  formMessage,
  warnings,
  onDownloadPng,
  onDownloadSvg,
}: QrPreviewProps) {
  const showCanvas = isRendered && !renderError;
  const ratio = contrastRatio(style.foreground, style.background);

  return (
    <section className="card" aria-labelledby="preview-title">
      <div className="card__header">
        <span className="card__step" aria-hidden="true">
          <Icon name="sparkle" size={14} />
        </span>
        <div className="card__headings">
          <h2 className="card__title" id="preview-title">
            Live preview
          </h2>
          <p className="card__hint">Updates as you type — the download matches exactly what you see.</p>
        </div>
      </div>

      <div className="preview__stage">
        {/* The canvas stays mounted so the ref is available before the first render. */}
        <canvas
          ref={canvasRef}
          className="preview__canvas"
          role="img"
          aria-label={showCanvas ? `QR code for ${encoded.slice(0, 120)}` : 'QR code preview'}
          hidden={!showCanvas}
        />
        {showCanvas ? null : (
          <div className="preview__placeholder">
            <span className="preview__placeholder-mark">
              <Icon name="image" size={24} />
            </span>
            <strong>{renderError ? 'Nothing to preview' : 'Your QR code appears here'}</strong>
            <span>{renderError ?? formMessage ?? 'Fill in the details on the left to generate a code.'}</span>
          </div>
        )}
      </div>

      {showCanvas ? (
        <>
          <div className="preview__meta">
            <span className="chip">{style.size} × {style.size} px</span>
            <span className="chip">ECC {style.ecc}</span>
            <span className="chip">{style.margin} module margin</span>
            <span className="chip">{ratio.toFixed(1)}:1 contrast</span>
          </div>
          <p className="preview__payload" aria-label="Encoded payload">
            {encoded}
          </p>
        </>
      ) : null}

      <div className="preview__actions">
        <button type="button" className="btn btn--primary" disabled={!showCanvas} onClick={onDownloadPng}>
          <Icon name="download" size={16} />
          Download PNG
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!showCanvas}
          onClick={onDownloadSvg}
          aria-label="Download SVG"
        >
          <Icon name="download" size={16} />
          SVG
        </button>
      </div>

      {renderError ? (
        <div className="callouts">
          <Callout tone="danger">{renderError}</Callout>
        </div>
      ) : warnings.length > 0 ? (
        <div className="callouts">
          {warnings.map((warning) => (
            <Callout key={warning.id} tone={warning.level === 'warning' ? 'warning' : 'info'}>
              {warning.message}
            </Callout>
          ))}
        </div>
      ) : showCanvas ? (
        <div className="callouts">
          <Callout tone="success">These settings scan reliably.</Callout>
        </div>
      ) : null}
    </section>
  );
}
