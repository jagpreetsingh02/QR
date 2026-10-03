import type { Theme } from '../hooks/useTheme';
import { Link } from '../Link';
import { Logo } from '../components/brand/Logo';
import { ThemeToggle } from '../components/brand/ThemeToggle';
import { Icon } from '../components/Icon';

const SECTIONS = [
  ['types', 'Types'],
  ['design', 'Design'],
  ['scan-check', 'Scan check'],
  ['privacy', 'Privacy'],
  ['faq', 'FAQ'],
] as const;

export function SiteNav({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  return (
    <header className="site-nav">
      <nav className="site-nav__bar container" aria-label="Main">
        <Logo />
        <ul className="site-nav__links">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
        <div className="site-nav__actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Link to="/studio" className="button button--primary button--sm">
            Open Studio
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
