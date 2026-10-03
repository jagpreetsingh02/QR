import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Advances an index on an interval; pauses while `paused` or the tab is hidden. */
export function useCycle(length: number, intervalMs: number, paused: boolean): [number, (i: number) => void] {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (paused || hidden || length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, hidden, length, intervalMs]);

  return [index, setIndex];
}

/** Reveals `text` character by character; returns it whole when `instant`. */
export function useTypewriter(text: string, instant: boolean, msPerChar = 22): string {
  const [state, setState] = useState({ text, count: 0 });
  // Restart during render when the text changes (no effect round-trip).
  if (state.text !== text) setState({ text, count: 0 });

  useEffect(() => {
    if (instant) return;
    const timer = window.setInterval(() => {
      setState((s) => (s.count >= s.text.length ? s : { ...s, count: s.count + 1 }));
    }, msPerChar);
    const stop = window.setTimeout(() => window.clearInterval(timer), (text.length + 2) * msPerChar);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [text, instant, msPerChar]);

  return instant ? text : text.slice(0, state.count);
}
