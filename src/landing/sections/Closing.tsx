import { Link } from '../../Link';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../components/brand/Logo';

export const REPO_URL = 'https://github.com/jagpreetsingh02/QR';
export const LIVE_URL = 'https://qr-studio-jagpreet-singh1.vercel.app';

export function FinalCta() {
  return (
    <section className="lp-final" aria-labelledby="final-title">
      <div className="container">
        <div className="lp-final__card">
          <span className="lp-shape lp-shape--ring lp-final__ring" aria-hidden="true" />
          <span className="lp-shape lp-shape--dot lp-final__dot" aria-hidden="true" />
          <h2 id="final-title" className="type-display-l">
            Make a code you can trust on the first scan.
          </h2>
          <Link to="/studio" className="button button--lg lp-final__cta">
            Open the studio
            <Icon name="arrow-right" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="container lp-footer__inner">
        <div className="lp-footer__brand">
          <LogoMark size={32} />
          <p>
            <strong>QR Studio</strong> · Built for <strong>GDG on Campus SRM</strong>
            <br />
            Technical Recruitment 2026-27 · Frontend Task 1
          </p>
        </div>
        <ul className="lp-footer__links">
          <li>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Icon name="github" size={18} /> Source on GitHub
            </a>
          </li>
          <li>
            <a href={LIVE_URL} target="_blank" rel="noreferrer">
              <Icon name="external" size={18} /> Live site
            </a>
          </li>
          <li>
            <Link to="/studio">Open the studio</Link>
          </li>
        </ul>
        <p className="lp-footer__note">Independent project. Not affiliated with or endorsed by Google.</p>
      </div>
    </footer>
  );
}
