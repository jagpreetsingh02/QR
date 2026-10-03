import { Reveal } from '../Reveal';

const STEPS = [
  ['Pick a type and fill it in', 'URL, text, email, phone or Wi-Fi. Mistakes are flagged as you type, in plain language.'],
  ['Design it and read the scan check', 'Choose a preset, tune colours, size, margin and error correction, add a logo. The advisor flags anything risky.'],
  ['Download PNG or SVG', 'The PNG is the exact pixels of the preview; the SVG is the same geometry, lossless for print.'],
] as const;

export function HowItWorks() {
  return (
    <section className="lp-section lp-how" aria-labelledby="how-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="how-title" className="type-display-l">
            Three steps, about thirty seconds.
          </h2>
        </Reveal>
        <ol className="lp-how__steps">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="lp-how__step" data-tone={i}>
              <span className="lp-how__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="type-title-l">{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
