import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryEntry, PhotoStyle, QrContent, QrStyle, QrType } from '../types';
import type { Theme } from '../hooks/useTheme';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useHistory } from '../hooks/useHistory';
import { useQrCanvas } from '../hooks/useQrCanvas';
import { buildFilename, downloadFile } from '../lib/download';
import { DEFAULT_STYLE } from '../lib/presets';
import type { Preset } from '../lib/presets';
import { createEmptyDrafts, describeContent, encodeContent } from '../lib/qrContent';
import { renderToCanvas, renderToPngDataUrl, renderToSvg } from '../lib/render';
import { decodeCanvas } from '../lib/decode';
import { effectiveStyle } from '../lib/photo';
import { getScanWarnings } from '../lib/scanAdvice';
import { hasErrors, payloadBytes, validateContent } from '../lib/validation';
import { getImage, pruneImages } from '../lib/imageStore';
import { ContentForm } from '../components/ContentForm';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { MotionProvider } from '../components/MotionProvider';
import { Logo } from '../components/brand/Logo';
import { Link } from '../Link';
import { ThemeToggle } from '../components/brand/ThemeToggle';
import { TypePicker } from './TypePicker';
import { Stage } from './Stage';
import { ExportBar } from './ExportBar';
import { ScanCheck } from './ScanCheck';
import { DesignPanel } from './DesignPanel';
import { RecentCodes } from './RecentCodes';
import { Toast } from './Toast';
import { getVerdict } from './readings';
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
  // Errors appear once a type's fields have been touched, not on first load.
  const [touched, setTouched] = useState<Partial<Record<QrType, boolean>>>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [boosting, setBoosting] = useState(false);
  const toastId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Publishes the pinned stage's height so the mobile tabs can pin right under it.
  useEffect(() => {
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>('.stage');
    if (!root || !stage || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => root.style.setProperty('--stage-h', `${Math.round(entry.borderBoxSize?.[0]?.blockSize ?? stage.offsetHeight)}px`));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const content = drafts[type];
  const errors = useMemo(() => validateContent(content), [content]);
  const isValid = !hasErrors(errors);
  const encoded = useMemo(() => (isValid ? encodeContent(content) : ''), [content, isValid]);

  // What is actually rendered: a photo style raises error correction to at least Q.
  const renderStyle = useMemo(() => effectiveStyle(style), [style]);
  const { canvasRef, error: renderError, isRendered, decode } = useQrCanvas(encoded, renderStyle, isValid);
  const warnings = useMemo(() => (isValid && !renderError ? getScanWarnings(renderStyle, encoded) : []), [isValid, renderError, renderStyle, encoded]);

  const notify = useCallback((tone: ToastMessage['tone'], message: string, action?: ToastMessage['action']) => {
    toastId.current += 1;
    setToast({ id: toastId.current, tone, message, action });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const updateContent = useCallback((next: QrContent) => {
    setActiveId(null);
    setTouched((current) => (current[next.type] ? current : { ...current, [next.type]: true }));
    setDrafts((current) => ({ ...current, [next.type]: next }));
  }, []);

  const updateStyle = useCallback((patch: Partial<QrStyle>) => setStyle((current) => ({ ...current, ...patch })), []);

  const applyPreset = useCallback((preset: Preset) => {
    setStyle((current) => ({ ...current, foreground: preset.foreground, background: preset.background, margin: preset.margin }));
  }, []);

  const updatePhoto = useCallback((photo: PhotoStyle | null) => {
    if (photo) setPhotoNote(null);
    setStyle((current) => ({ ...current, photo }));
  }, []);

  /**
   * Raises contrast and lowers photo strength step by step, test-scanning an
   * off-screen render each time, and applies the first setting that decodes.
   */
  const boostReadability = useCallback(async () => {
    if (!style.photo || !encoded) return;
    setBoosting(true);
    const probe = document.createElement('canvas');
    let candidate: QrStyle = style;
    let decoded = false;
    for (let step = 0; step < 8 && !decoded; step += 1) {
      const photo = candidate.photo!;
      const next =
        photo.mode === 'dots'
          ? {
              ...photo,
              dotScale: Math.min(80, photo.dotScale + 6),
              halo: Math.min(100, photo.halo + 15),
              eyeOpacity: Math.min(100, photo.eyeOpacity + 5),
              readability: Math.min(100, photo.readability + 12),
              photoContrast: Math.max(-50, photo.photoContrast - 8),
            }
          : { ...photo, contrast: Math.min(100, photo.contrast + 15), strength: Math.max(0, photo.strength - 12) };
      candidate = { ...candidate, photo: next };
      await renderToCanvas(probe, encoded, effectiveStyle(candidate));
      decoded = (await decodeCanvas(probe)) === encoded;
    }
    setBoosting(false);
    const previous = style;
    setStyle(candidate);
    if (decoded) {
      const p = candidate.photo!;
      const summary = p.mode === 'dots' ? `dots ${p.dotScale}%, halo ${p.halo}%, readability ${p.readability}%` : `strength ${p.strength}%, contrast ${p.contrast}%`;
      notify('success', `Readable now: ${summary}.`, { label: 'Undo', run: () => setStyle(previous) });
    } else {
      setStyle(previous);
      notify('error', 'This photo is too busy for this content even after boosting. Try a calmer photo, a shorter link, or less Detail.');
    }
  }, [style, encoded, notify]);

  const resetDesign = useCallback(() => {
    const previous = style;
    setStyle(DEFAULT_STYLE);
    notify('info', 'Design reset to defaults.', { label: 'Undo', run: () => setStyle(previous) });
  }, [style, notify]);

  const restoreEntry = useCallback(
    async (entry: HistoryEntry) => {
      // Images come back from IndexedDB; an entry still restores if a blob is gone.
      const restored: QrStyle = { ...entry.style };
      const missing: string[] = [];
      if (entry.style.logoRef) {
        const blob = await getImage(entry.style.logoRef);
        if (blob) restored.logo = URL.createObjectURL(blob);
        else {
          restored.logo = null;
          restored.logoRef = null;
          missing.push('logo');
        }
      }
      if (entry.style.photo) {
        const blob = entry.style.photo.ref ? await getImage(entry.style.photo.ref) : null;
        if (blob) restored.photo = { ...entry.style.photo, src: URL.createObjectURL(blob) };
        else {
          restored.photo = null;
          missing.push('photo');
        }
      } else if (entry.photoOmitted) {
        missing.push('photo');
      }

      setType(entry.content.type);
      setDrafts((current) => ({ ...current, [entry.content.type]: entry.content }));
      setStyle(restored);
      setTouched((current) => ({ ...current, [entry.content.type]: true }));
      setActiveId(entry.id);
      setPanel('content');
      if (missing.length) {
        const what = missing.join(' and ');
        setPhotoNote(missing.includes('photo') ? 'This code used a photo that is no longer stored on this device, so it was restored without it. Add the photo again to reapply it.' : null);
        notify('info', `Restored “${entry.label || 'code'}” without its ${what} (no longer stored on this device).`);
      } else {
        setPhotoNote(null);
        notify('success', `Restored “${entry.label || 'code'}” with its design.`);
      }
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
        // Only the small thumbnail keeps the photo look; the photo itself is never stored.
        // Recent codes keep settings, a thumbnail and IndexedDB references, never image data.
        const { logo, photo } = settled.style;
        remember({
          encoded: settled.encoded,
          label: describeContent(settled.content),
          content: settled.content,
          style: { ...settled.style, logo: logo?.startsWith('data:') ? logo : null, photo: photo ? { ...photo, src: '' } : null },
          thumbnail,
          photoOmitted: Boolean(photo && !photo.ref),
        });
      })
      .catch(() => {
        /* A payload that cannot render is already explained on the stage. */
      });
    return () => {
      cancelled = true;
    };
  }, [settled, remember]);

  // Drop stored images that no recent code (and not the current design) uses.
  useEffect(() => {
    const keep = new Set<string>();
    for (const e of entries) {
      if (e.style.logoRef) keep.add(e.style.logoRef);
      if (e.style.photo?.ref) keep.add(e.style.photo.ref);
    }
    if (style.logoRef) keep.add(style.logoRef);
    if (style.photo?.ref) keep.add(style.photo.ref);
    const timer = window.setTimeout(() => void pruneImages(keep), 1500);
    return () => window.clearTimeout(timer);
  }, [entries, style.logoRef, style.photo?.ref]);

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
      const markup = await renderToSvg(encoded, renderStyle);
      const filename = buildFilename(type, describeContent(content), 'svg');
      downloadFile(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), filename);
      notify('success', `Saved ${filename}`);
      return true;
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : 'The SVG could not be created.');
      return false;
    }
  }, [content, encoded, renderStyle, type, notify]);

  /**
   * Copies the preview as a PNG. The blob is passed as a promise so Safari keeps
   * the user gesture; browsers without image clipboard support get the encoded
   * text instead, and say so.
   */
  const copyImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !isRendered) return false;
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('unsupported');
      const blob = new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      notify('success', 'Image copied. Paste it into your poster or chat.');
      return true;
    } catch {
      try {
        await navigator.clipboard.writeText(encoded);
        notify('info', 'This browser cannot copy images, so the encoded text was copied instead.');
        return true;
      } catch {
        notify('error', 'Copying is blocked here. Use Download PNG instead.');
        return false;
      }
    }
  }, [canvasRef, isRendered, encoded, notify]);

  // --- Keyboard shortcut: Cmd/Ctrl + Enter downloads the PNG -----------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && isRendered) {
        event.preventDefault();
        void downloadPng();
      }
      // Cmd/Ctrl+Z runs the pending Undo, but never steals undo from a text field.
      const inField = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key.toLowerCase() === 'z' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !inField && toast?.action) {
        event.preventDefault();
        toast.action.run();
        setToast(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [downloadPng, isRendered, toast]);

  const shownErrors = touched[type] ? errors : {};
  const firstError = Object.values(shownErrors)[0] ?? null;
  const canDownload = isRendered && !renderError;
  const verdict = canDownload ? getVerdict(renderStyle, warnings, decode) : null;
  const showScanCheck = useCallback(() => {
    const target = document.getElementById('scan-check');
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
  }, []);

  return (
    <MotionProvider>
      <div className="studio" data-panel={panel} ref={rootRef}>
        <header className="studio-bar">
          <Logo />
          <div className="studio-bar__actions">
            <Link to="/#faq" className="studio-bar__help" aria-label="Help">
              <Icon name="info" size={18} />
              <span>Help</span>
            </Link>
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
            <ContentForm content={content} errors={shownErrors} onChange={updateContent} />
          </section>

          <div className="studio-center">
            <div className="studio-stage-col">
              <Stage canvasRef={canvasRef} style={renderStyle} content={content} encoded={encoded} isRendered={isRendered} renderError={renderError} formMessage={firstError} verdict={verdict} onVerdict={showScanCheck} />
              <div className="studio-export">
                <ExportBar disabled={!canDownload} onPng={downloadPng} onSvg={downloadSvg} onCopy={copyImage} />
              </div>
              <ScanCheck style={renderStyle} warnings={warnings} active={canDownload} decode={decode} onBoost={boostReadability} boosting={boosting} />
            </div>
            <div className="studio-recent" data-panel-id="recent">
              <RecentCodes entries={entries} activeId={activeId} onRestore={(entry) => void restoreEntry(entry)} onRemove={removeEntry} onClear={clearHistory} />
            </div>
          </div>

          <div className="studio-design" data-panel-id="design">
            <DesignPanel style={style} previewText={encoded || PREVIEW_FALLBACK} onChange={updateStyle} onPreset={applyPreset} onReset={resetDesign} photoNote={photoNote} onPhoto={updatePhoto} payloadBytes={encoded ? payloadBytes(encoded) : 0} />
          </div>
        </main>

        <Toast toast={toast} onDismiss={dismissToast} />
      </div>
    </MotionProvider>
  );
}
