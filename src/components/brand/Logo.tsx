import { Link } from '../../Link';

/**
 * QR Studio's own mark: three QR finder patterns and one module, each in a
 * GDG colour. Deliberately not the GDG or Google logo.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="15" height="15" rx="5" fill="none" stroke="var(--color-brand-blue)" strokeWidth="4" />
      <rect x="7" y="7" width="5" height="5" rx="1.5" fill="var(--color-brand-blue)" />
      <rect x="23" y="2" width="15" height="15" rx="5" fill="none" stroke="var(--color-brand-red)" strokeWidth="4" />
      <rect x="28" y="7" width="5" height="5" rx="1.5" fill="var(--color-brand-red)" />
      <rect x="2" y="23" width="15" height="15" rx="5" fill="none" stroke="var(--color-brand-yellow)" strokeWidth="4" />
      <rect x="7" y="28" width="5" height="5" rx="1.5" fill="var(--color-brand-yellow)" />
      <circle cx="31.5" cy="31.5" r="5.5" fill="var(--color-brand-green)" />
    </svg>
  );
}

export function Logo({ showByline = true }: { showByline?: boolean }) {
  return (
    <Link to="/" className="wordmark" aria-label="QR Studio home">
      <LogoMark />
      <span>
        <span className="wordmark__name">QR Studio</span>
        {showByline ? <span className="wordmark__by">Built for GDG on Campus SRM</span> : null}
      </span>
    </Link>
  );
}
