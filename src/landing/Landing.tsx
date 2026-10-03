import { lazy, Suspense } from 'react';
import type { Theme } from '../hooks/useTheme';
import { SiteNav } from './SiteNav';
import { Hero } from './Hero';
import { TrustStrip } from './TrustStrip';
import '../styles/landing.css';

// Everything below the first screen ships as its own chunk.
const BelowFold = lazy(() => import('./BelowFold'));

export default function Landing({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  return (
    <div className="lp">
      <SiteNav theme={theme} toggleTheme={toggleTheme} />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Suspense fallback={<div className="lp-deferred" aria-hidden="true" />}>
          <BelowFold />
        </Suspense>
      </main>
    </div>
  );
}
