import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry, QrContent, QrStyle } from '../types';
import { HISTORY_LIMIT, loadHistory, saveHistory } from '../lib/storage';

export interface HistoryDraft {
  encoded: string;
  label: string;
  content: QrContent;
  style: QrStyle;
  thumbnail: string;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Recently generated codes, persisted to localStorage. Entries are keyed by
 * their encoded payload, so re-styling the same content updates the existing
 * entry instead of filling the list with near-duplicates.
 */
export function useHistory() {
  // Read once during the first render so a refresh restores instantly.
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  const remember = useCallback((draft: HistoryDraft) => {
    setEntries((current) => {
      const existing = current.find((entry) => entry.encoded === draft.encoded);
      const entry: HistoryEntry = {
        id: existing?.id ?? createId(),
        createdAt: Date.now(),
        ...draft,
      };
      const rest = current.filter((item) => item.encoded !== draft.encoded);
      return [entry, ...rest].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, remember, remove, clear };
}
