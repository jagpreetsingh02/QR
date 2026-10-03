import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Icon } from '../components/Icon';

export interface ToastMessage {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
  action?: { label: string; run: () => void };
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, toast.action ? 6000 : 2800);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toast ? (
          <m.div
            key={toast.id}
            className="toast"
            data-tone={toast.tone}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: [0.05, 0.7, 0.1, 1] }}
          >
            <Icon name={toast.tone === 'error' ? 'alert' : toast.tone === 'info' ? 'info' : 'check-circle'} size={18} />
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action?.run();
                  onDismiss();
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
