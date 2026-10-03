import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';

const loadFeatures = () => import('../motion-features').then((mod) => mod.default);

/** Shared motion setup: lazy features and reduced-motion respected everywhere. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
