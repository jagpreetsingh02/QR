import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryEntry, QrContent, QrStyle, QrType } from '../types';
import type { Theme } from '../hooks/useTheme';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useHistory } from '../hooks/useHistory';
import { useQrCanvas } from '../hooks/useQrCanvas';
import { buildFilename, downloadFile } from '../lib/download';
import { DEFAULT_STYLE } from '../lib/presets';
import type { Preset } from '../lib/presets';
import { createEmptyDrafts, describeContent, encodeContent } from '../lib/qrContent';
import { renderToPngDataUrl, renderToSvg } from '../lib/render';
import { getScanWarnings } from '../lib/scanAdvice';
import { hasErrors, validateContent } from '../lib/validation';
import { ContentForm } from '../components/ContentForm';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { MotionProvider } from '../components/MotionProvider';
import { Logo } from '../components/brand/Logo';
import { ThemeToggle } from '../components/brand/ThemeToggle';
import { TypePicker } from './TypePicker';
import { Stage } from './Stage';
import { ExportBar } from './ExportBar';
import { ScanCheck } from './ScanCheck';
import { DesignPanel } from './DesignPanel';
import { RecentCodes } from './RecentCodes';
import { Toast } from './Toast';
import type { ToastMessage } from './Toast';
import '../styles/studio.css';

/** Edge length of the thumbnails kept in localStorage alongside each entry. */
const THUMBNAIL_SIZE = 128;
/** How long the inputs must be quiet before an entry is written to history. */
const HISTORY_DEBOUNCE_MS = 900;
/** Shown in preset swatches until the person has typed a valid payload. */
const PREVIEW_FALLBACK = 'https://gdg.community.dev';

type Panel = 'content' | 'design' | 'recent';
const PANELS: Array<[Panel, string, IconName]> = [
  ['content', 'Content', 'text'],
  ['design', 'Design', 'palette'],
  ['recent', 'Recent', 'history'],
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function Studio({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const { entries, remember, remove, clear, restore } = useHistory();

  const [type, setType] = useState<QrType>('url');
  const [drafts, setDrafts] = useState(createEmptyDrafts);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('content');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);

  const content = drafts[type];
  const errors = useMemo(() => validateContent(content), [content]);
  const isValid = !hasErrors(errors);
  const encoded = useMemo(() => (isValid ? encodeContent(content) : ''), [content, isValid]);

  const { canvasRef, error: renderError, isRendered } = useQrCanvas(encoded, style, isValid);
  const warnings = useMemo(() => (isValid && !renderError ? getScanWarnings(style, encoded) : []), [isValid, renderError, style, encoded]);

  const notify = useCallback((tone: ToastMessage['tone'], message: string, action?: ToastMessage['action']) => {
    toastId.current += 1;
    setToast({ id: toastId.current, tone, message, action });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const updateContent = useCallback((next: QrContent) => {
    setActiveId(null);
    setDrafts((current) => ({ ...current, [next.type]: next }));
  }, []);

  const updateStyle = useCallback((patch: Partial<QrStyle>) => setStyle((current) => ({ ...current, ...patch })), []);

  const applyPreset = useCallback((preset: Preset) => {
    setStyle((current) => ({ ...current, foreground: preset.foreground, background: preset.background, margin: preset.margin }));
  }, []);

  const resetDesign = useCallback(() => {
    const previous = style;
    setStyle(DEFAULT_STYLE);
    notify('info', 'Design reset to defaults.', { label: 'Undo', run: () => setStyle(previous) });
  }, [style, notify]);

  const restoreEntry = useCallback(
    (entry: HistoryEntry) => {
      setType(entry.content.type);
      setDrafts((current) => ({ ...current, [entry.content.type]: entry.content }));
      setStyle(entry.style);
      setActiveId(entry.id);
      setPanel('content');
      notify('success', `Restored “${entry.label || 'code'}” with its design.`);
    },
    [notify],
  );

  const removeEntry = useCallback(
    (entry: HistoryEntry) => {
      const previous = entries;
      remove(entry.id);
      notify('info', 'Removed from recent codes.', { label: 'Undo', run: () => restore(previous) });
    },
    [entries, remove, restore, notify],
  );

  const clearHistory = useCallback(() => {
    const previous = entries;
    clear();
    notify('info', `Cleared ${previous.length} recent code${previous.length === 1 ? '' : 's'}.`, { label: 'Undo', run: () => restore(previous) });
  }, [entries, clear, restore, notify]);

  // --- Persist settled codes to history (unchanged behaviour) -------------
  const snapshot = useMemo(() => ({ encoded, content, style }), [encoded, content, style]);
  const settled = useDebouncedValue(snapshot, HISTORY_DEBOUNCE_MS);

  useEffect(() => {
    if (!settled.encoded) return;
    let cancelled = false;
    renderToPngDataUrl(settled.encoded, { ...settled.style, size: THUMBNAIL_SIZE })
      .then((thumbnail) => {
        if (cancelled) return;
        remember({ encoded: settled.encoded, label: describeContent(settled.content), content: settled.content, style: settled.style, thumbnail });
      })
      .catch(() => {
        /* A payload that cannot render is already explained on the stage. */
      });
    return () => {
      cancelled = true;
    };
  }, [settled, remember]);

  // --- Downloads ------------------------------------------------------------
  const downloadPng = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas || !isRendered) return resolve(false);
        const filename = buildFilename(type, describeContent(content), 'png');
        // Exporting the preview canvas itself guarantees the file matches the preview.
        canvas.toBlob((blob) => {
          if (!blob) {
            notify('error', 'This browser could not export the PNG.');
            return resolve(false);
          }
          downloadFile(blob, filename);
          notify('success', `Saved ${filename}`);
          resolve(true);
        }, 'image/png');
      }),
    [canvasRef, isRendered, content, type, notify],
  );

  const downloadSvg = useCallback(async () => {
    try {
      const markup = await renderToSvg(encoded, style);
      const filename = buildFilename(type, describeContent(content), 'svg');
      downloadFile(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), filename);
      notify('success', `Saved ${filename}`);
      return true;
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : 'The SVG could not be created.');
      return false;
    }
  }, [content, encoded, style, type, notify]);

  // --- Keyboard shortcut: Cmd/Ctrl + Enter downloads the PNG -----------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && isRendered) {
        event.preventDefault();
        void downloadPng();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [downloadPng, isRendered]);

  const firstError = Object.values(errors)[0] ?? null;
  const canDownload = isRendered && !renderError;

  return (
    <MotionProvider>
      <div className="studio" data-panel={panel}>
        <header className="studio-bar">
          <Logo />
          <div className="studio-bar__actions">
            <span className="studio-bar__shortcut">
              <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd>
              <kbd className="kbd">↵</kbd>
              <span>Download PNG</span>
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <h1 className="visually-hidden">QR Studio: design your QR code</h1>
        <main id="main" className="studio-main">

          <nav className="studio-tabs" aria-label="Studio panels">
            {PANELS.map(([id, label, icon]) => (
              <button key={id} type="button" className="studio-tabs__tab" aria-pressed={panel === id} onClick={() => setPanel(id)}>
                <Icon name={icon} size={18} />
                {label}
                {id === 'recent' && entries.length > 0 ? <span className="studio-tabs__count">{entries.length}</span> : null}
              </button>
            ))}
          </nav>

          <section className="panel content-panel" data-panel-id="content" aria-labelledby="content-title">
            <div className="panel-head">
              <h2 id="content-title" className="panel-head__title">
                Content
              </h2>
            </div>
            <TypePicker
              value={type}
              onChange={(next) => {
                setType(next);
                setActiveId(null);
              }}
            />
            <ContentForm content={content} errors={errors} onChange={updateContent} />
          </section>

          <div className="studio-center">
            <div className="studio-stage-col">
              <Stage canvasRef={canvasRef} style={style} content={content} encoded={encoded} isRendered={isRendered} renderError={renderError} formMessage={firstError} />
              <div className="studio-export">
                <ExportBar disabled={!canDownload} onPng={downloadPng} onSvg={downloadSvg} />
              </div>
              <ScanCheck style={style} warnings={warnings} active={canDownload} />
            </div>
            <div className="studio-recent" data-panel-id="recent">
              <RecentCodes entries={entries} activeId={activeId} onRestore={restoreEntry} onRemove={removeEntry} onClear={clearHistory} />
            </div>
          </div>

          <div className="studio-design" data-panel-id="design">
            <DesignPanel style={style} previewText={encoded || PREVIEW_FALLBACK} onChange={updateStyle} onPreset={applyPreset} onReset={resetDesign} />
          </div>
        </main>

        <Toast toast={toast} onDismiss={dismissToast} />
      </div>
    </MotionProvider>
  );
}
