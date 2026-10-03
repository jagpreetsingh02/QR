import { useId, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Reveal } from '../Reveal';

const QUESTIONS = [
  ['Is it free? Do I need an account?', 'It is free and there is no account. QR Studio runs entirely in your browser; open the studio and start.'],
  ['Where is my data stored?', 'Only in this browser. Recent codes are kept in localStorage on this device so you can reopen them, and you can remove one or clear them all from the studio. Nothing is uploaded.'],
  ['Why does my code show a warning?', 'The scan check looks at contrast, quiet zone, size, logo coverage and payload density. A warning means a phone camera may struggle, especially in poor light or when printed small. You can still download; the advice explains how to fix it.'],
  ['PNG or SVG?', 'PNG is pixel-exact to the preview and right for screens and quick prints. SVG is vector, so it stays sharp at any size and is the better choice for posters and professional printing.'],
  ['Can I add a logo?', 'Yes. A centre logo covers some modules, so raise error correction to Q or H and keep the logo at 25% of the code or less. The scan check reminds you if you do not.'],
  ['Will my code ever stop working?', 'No. These are static codes: the data itself is inside the code, with no redirect service in between that could expire or change.'],
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();
  return (
    <section className="lp-section lp-faq" id="faq" aria-labelledby="faq-title">
      <div className="container lp-faq__grid">
        <Reveal>
          <h2 id="faq-title" className="type-display-l">
            Questions, answered.
          </h2>
        </Reveal>
        <div className="lp-faq__list">
          {QUESTIONS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={`lp-faq__item${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`${baseId}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${baseId}-a${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{q}</span>
                    <Icon name="chevron-down" size={20} />
                  </button>
                </h3>
                <div className="lp-faq__answer" id={`${baseId}-a${i}`} role="region" aria-labelledby={`${baseId}-q${i}`} hidden={!isOpen}>
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
