import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
import { Link } from '../../Link';
import { Reveal } from '../Reveal';

/** Real codes rendered by the studio's photo engine (scripts/landing-assets.mjs); all decode. */
const EXAMPLES = [
  { src: '/showcase/photo-dots-face.webp', blend: 'Dots', note: 'One dot per module, the photo everywhere else' },
  { src: '/showcase/photo-dots-landscape.webp', blend: 'Dots', note: 'Eyes on a light plate, timing kept solid' },
  { src: '/showcase/photo-tint-bands.webp', blend: 'Tinted', note: 'Each module takes the photo’s colour' },
];

const FEATURES: ReadonlyArray<{ icon: IconName; title: string; body: string }> = [
  { icon: 'sliders', title: 'Tune every dot', body: 'Dot size and shape, a halo that appears only where the photo needs it, eye plate, border and Detail.' },
  { icon: 'scan', title: 'Test-scanned as you edit', body: 'Each render is decoded in your browser. If it fails, Boost readability fixes it or tells you honestly.' },
  { icon: 'shield', title: 'Your photo stays here', body: 'Up to 25 MB, processed on this device and kept in local storage. Never uploaded, never in a link.' },
  { icon: 'download', title: 'Vector SVG too', body: 'The SVG keeps dots and eyes as vectors over the embedded photo; the PNG matches the preview exactly.' },
];

export function PhotoSection() {
  return (
    <section className="lp-section lp-photo" id="photo" aria-labelledby="photo-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="photo-title" className="type-display-l">
            Put a photo in the code.
          </h2>
          <p className="type-body-l">
            Photo QR turns a picture into a code that still scans. A scanner only reads the centre of each module, so
            QR Studio puts a small dot there and lets the photo show everywhere else.
          </p>
        </Reveal>

        <ul className="lp-photo__examples" aria-label="Photo QR examples">
          {EXAMPLES.map((ex) => (
            <li key={ex.src} className="lp-photo__example">
              <img src={ex.src} width={560} height={560} loading="lazy" decoding="async" alt={`Photo QR code, ${ex.blend} blend, linking to gdg.community.dev`} />
              <span className="lp-photo__blend">{ex.blend}</span>
              <span className="lp-photo__note">{ex.note}</span>
            </li>
          ))}
        </ul>

        <ul className="lp-photo__features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <span className="lp-photo__icon" aria-hidden="true">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="type-title-m">{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>

        <p className="lp-photo__cta">
          <Link to="/studio" className="button button--secondary">
            <Icon name="image" size={18} /> Try Photo QR in the studio
          </Link>
          <span>Every example above is a real code from the studio, and each one decodes.</span>
        </p>
      </div>
    </section>
  );
}
