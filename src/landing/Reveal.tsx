import type { ReactNode } from 'react';
import * as m from 'motion/react-m';

/** A short settle for section headings; content is visible from the start (transform only). */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.56, ease: [0.05, 0.7, 0.1, 1] }}
    >
      {children}
    </m.div>
  );
}
