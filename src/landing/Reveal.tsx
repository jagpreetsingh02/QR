import type { ReactNode } from 'react';
import * as m from 'motion/react-m';

/** A short, emphasized entrance used for section headings only. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.56, ease: [0.05, 0.7, 0.1, 1] }}
    >
      {children}
    </m.div>
  );
}
