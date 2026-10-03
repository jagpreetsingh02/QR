/**
 * A tiny IndexedDB wrapper for image blobs (photos and logos). Images moved
 * here from localStorage, which capped logos at 256 KB. Everything stays on
 * this device. If IndexedDB is unavailable (some private modes) every call
 * degrades to a no-op and callers fall back to "no history images".
 */
const DB_NAME = 'qr-studio';
const STORE = 'images';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Ids created in this session are never pruned (they may not be in history yet). */
const sessionIds = new Set<string>();

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Stores a blob and returns its id, or null when storage is unavailable. */
export async function putImage(blob: Blob): Promise<string | null> {
  const id = newId();
  const ok = await run('readwrite', (store) => store.put(blob, id));
  if (ok === null) return null;
  sessionIds.add(id);
  return id;
}

export async function getImage(id: string): Promise<Blob | null> {
  const result = await run<unknown>('readonly', (store) => store.get(id));
  return result instanceof Blob ? result : null;
}

/** Deletes every stored image whose id is not in `keep`. */
export async function pruneImages(keep: Set<string>): Promise<void> {
  const keys = await run<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  if (!keys) return;
  const stale = keys.filter((k): k is string => typeof k === 'string' && !keep.has(k) && !sessionIds.has(k));
  await Promise.all(stale.map((k) => run('readwrite', (store) => store.delete(k))));
}
