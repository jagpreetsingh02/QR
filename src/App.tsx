import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HistoryEntry, QrContent, QrStyle, QrType } from './types';
import { ContentForm } from './components/ContentForm';
import { HistoryPanel } from './components/HistoryPanel';
import { Icon } from './components/Icon';
import { PresetPicker } from './components/PresetPicker';
import { QrPreview } from './components/QrPreview';
import { StyleControls } from './components/StyleControls';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useHistory } from './hooks/useHistory';
import { useQrCanvas } from './hooks/useQrCanvas';
import { useTheme } from './hooks/useTheme';
import { buildFilename, downloadFile } from './lib/download';
import { DEFAULT_STYLE } from './lib/presets';
import type { Preset } from './lib/presets';
import { createEmptyDrafts, describeContent, encodeContent, QR_TYPE_META } from './lib/qrContent';
import { renderToPngDataUrl, renderToSvg } from './lib/render';
import { getScanWarnings } from './lib/scanAdvice';
import { hasErrors, validateContent } from './lib/validation';
import { TypeSelector } from './components/TypeSelector';

/** Edge length of the thumbnails kept in localStorage alongside each entry. */
const THUMBNAIL_SIZE = 128;
/** How long the inputs must be quiet before an entry is written to history. */
const HISTORY_DEBOUNCE_MS = 900;

interface Toast {
  tone: 'success' | 'error';
  message: string;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { entries, remember, remove, clear } = useHistory();

  const [type, setType] = useState<QrType>('url');
  const [drafts, setDrafts] = useState(createEmptyDrafts);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const content = drafts[type];
  const errors = useMemo(() => validateContent(content), [content]);
  const isValid = !hasErrors(errors);
  const encoded = useMemo(() => (isValid ? encodeContent(content) : ''), [content, isValid]);

  const { canvasRef, error: renderError, isRendered } = useQrCanvas(encoded, style, isValid);
  const warnings = useMemo(
    () => (isValid && !renderError ? getScanWarnings(style, encoded) : []),
    [isValid, renderError, style, encoded],
  );

  const updateContent = useCallback((next: QrContent) => {
    setActiveId(null);
    setDrafts((current) => ({ ...current, [next.type]: next }));
  }, []);

  const updateStyle = useCallback((patch: Partial<QrStyle>) => {
    setStyle((current) => ({ ...current, ...patch }));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setStyle((current) => ({
      ...current,
      foreground: preset.foreground,
      background: preset.background,
      margin: preset.margin,
    }));
  }, []);

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    setType(entry.content.type);
    setDrafts((current) => ({ ...current, [entry.content.type]: entry.content }));
    setStyle(entry.style);
    setActiveId(entry.id);
    setToast({ tone: 'success', message: 'Restored from recent codes.' });
  }, []);

  // --- Persist settled codes to history ---------------------------------
  const snapshot = useMemo(() => ({ encoded, content, style }), [encoded, content, style]);
  const settled = useDebouncedValue(snapshot, HISTORY_DEBOUNCE_MS);

  useEffect(() => {
    if (!settled.encoded) return;
    let cancelled = false;

    renderToPngDataUrl(settled.encoded, { ...settled.style, size: THUMBNAIL_SIZE })
      .then((thumbnail) => {
        if (cancelled) return;
        remember({
          encoded: settled.encoded,
          label: describeContent(settled.content),
          content: settled.content,
          style: settled.style,
          thumbnail,
        });
      })
      .catch(() => {
        /* A payload that cannot render is already reported in the preview. */
      });

    return () => {
      cancelled = true;
    };
  }, [settled, remember]);

  // --- Toast auto-dismiss ------------------------------------------------
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // --- Downloads ---------------------------------------------------------
  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = buildFilename(type, describeContent(content), 'png');

    // Downloading the preview canvas itself guarantees a pixel-perfect match.
    canvas.toBlob((blob) => {
      if (!blob) {
        setToast({ tone: 'error', message: 'This browser could not export the PNG.' });
        return;
      }
      downloadFile(blob, filename);
      setToast({ tone: 'success', message: `Saved ${filename}` });
    }, 'image/png');
  }, [canvasRef, content, type]);

  const downloadSvg = useCallback(async () => {
    try {
      const markup = await renderToSvg(encoded, style);
      const filename = buildFilename(type, describeContent(content), 'svg');
      downloadFile(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), filename);
      setToast({ tone: 'success', message: `Saved ${filename}` });
    } catch (cause) {
      setToast({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'The SVG could not be created.',
      });
    }
  }, [content, encoded, style, type]);

  const firstError = Object.values(errors)[0];

  return (
    <div className="app">
      <header className="header">
        <div className="shell header__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              <Icon name="spark" size={20} />
            </span>
            <div className="brand__text">
              <div className="brand__title">QR Studio</div>
              <div className="brand__subtitle">Generate, design and download QR codes — entirely in your browser.</div>
            </div>
          </div>
          <div className="header__actions">
            <button
              type="button"
              className="btn btn--icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="shell layout">
          <section className="card area-content" aria-labelledby="content-title">
            <div className="card__header">
              <span className="card__step" aria-hidden="true">1</span>
              <div className="card__headings">
                <h2 className="card__title" id="content-title">
                  What should the code do?
                </h2>
                <p className="card__hint">Pick a type, then fill in the details.</p>
              </div>
            </div>
            <div className="stack">
              <TypeSelector value={type} onChange={(next) => { setType(next); setActiveId(null); }} />
              <ContentForm content={content} errors={errors} onChange={updateContent} />
            </div>
          </section>

          <div className="area-preview">
            <QrPreview
              canvasRef={canvasRef}
              style={style}
              encoded={encoded}
              isRendered={isRendered}
              renderError={renderError}
              formMessage={firstError ?? null}
              warnings={warnings}
              onDownloadPng={downloadPng}
              onDownloadSvg={downloadSvg}
            />
          </div>

          <section className="card area-presets" aria-labelledby="presets-title">
            <div className="card__header">
              <span className="card__step" aria-hidden="true">2</span>
              <div className="card__headings">
                <h2 className="card__title" id="presets-title">
                  Presets
                </h2>
                <p className="card__hint">A starting point for the colours and quiet zone — keep tuning afterwards.</p>
              </div>
            </div>
            <PresetPicker style={style} onApply={applyPreset} />
          </section>

          <section className="card area-style" aria-labelledby="style-title">
            <div className="card__header">
              <span className="card__step" aria-hidden="true">3</span>
              <div className="card__headings">
                <div className="row-between">
                  <div>
                    <h2 className="card__title" id="style-title">
                      Customise
                    </h2>
                    <p className="card__hint">Every change is reflected in the preview and in your download.</p>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStyle(DEFAULT_STYLE)}>
                    <Icon name="restore" size={14} />
                    Reset design
                  </button>
                </div>
              </div>
            </div>
            <StyleControls style={style} onChange={updateStyle} />
          </section>

          <div className="area-history">
            <HistoryPanel
              entries={entries}
              activeId={activeId}
              onRestore={restoreEntry}
              onRemove={remove}
              onClear={clear}
            />
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <span>QR Studio — built for GDG on Campus SRM Technical Recruitment 2026.</span>
          <span>
            Currently encoding a {QR_TYPE_META[type].label} code · nothing leaves your device.
          </span>
        </div>
      </footer>

      {toast ? (
        <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
          <Icon name={toast.tone === 'error' ? 'warning' : 'check'} size={16} />
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
