import { lazy, Suspense, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { usePathname } from './router';
import Landing from './landing/Landing';

// The studio is its own chunk; the landing page prefetches it once idle so
// "Open Studio" is instant and keeps working offline after the first load.
const loadStudio = () => import('./studio/Studio');
const Studio = lazy(loadStudio);

const TITLES = {
  landing: 'QR Studio — QR codes that actually scan',
  studio: 'Studio · QR Studio',
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isStudio = pathname.replace(/\/+$/, '') === '/studio';

  useEffect(() => {
    document.title = isStudio ? TITLES.studio : TITLES.landing;
  }, [isStudio]);

  useEffect(() => {
    if (isStudio) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => void loadStudio());
  }, [isStudio]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {isStudio ? (
        <Suspense fallback={<div className="route-loading" role="status">Opening the studio…</div>}>
          <Studio theme={theme} toggleTheme={toggleTheme} />
        </Suspense>
      ) : (
        <Landing theme={theme} toggleTheme={toggleTheme} />
      )}
    </>
  );
}
