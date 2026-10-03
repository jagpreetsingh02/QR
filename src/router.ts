import { useSyncExternalStore } from 'react';

/**
 * A deliberately tiny History-API router: two routes do not justify a router
 * dependency. Vercel rewrites every path to index.html, so /studio deep-links.
 */
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener('popstate', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('popstate', callback);
  };
}

export function usePathname(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
}

/** Scrolls to an anchor, waiting briefly for lazily rendered sections to mount. */
function scrollToHash(hash: string, attempts = 40): void {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (target) target.scrollIntoView();
  else if (hash && attempts > 0) window.setTimeout(() => scrollToHash(hash, attempts - 1), 50);
  else window.scrollTo(0, 0);
}

export function navigate(to: string): void {
  const url = new URL(to, window.location.href);
  const samePage = url.pathname === window.location.pathname;
  window.history.pushState(null, '', url.pathname + url.search + url.hash);
  listeners.forEach((listener) => listener());
  // Wait for the next route to render before scrolling to its anchor.
  requestAnimationFrame(() => (samePage && !url.hash ? window.scrollTo(0, 0) : scrollToHash(url.hash)));
}
