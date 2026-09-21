import type { SVGProps } from 'react';

export type IconName =
  | 'link'
  | 'text'
  | 'mail'
  | 'phone'
  | 'wifi'
  | 'download'
  | 'sun'
  | 'moon'
  | 'trash'
  | 'warning'
  | 'info'
  | 'image'
  | 'swap'
  | 'restore'
  | 'close'
  | 'check'
  | 'spark';

/** Single-path icon set kept inline so the app ships without an icon library. */
const PATHS: Record<IconName, string> = {
  link: 'M9 15 15 9M10.5 6.5 12 5a4.95 4.95 0 1 1 7 7l-1.5 1.5M13.5 17.5 12 19a4.95 4.95 0 1 1-7-7l1.5-1.5',
  text: 'M4 6h16M4 12h16M4 18h10',
  mail: 'M3 6.5h18v11H3zM3 7l9 6 9-6',
  phone: 'M7 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 5 5.7 2 2 0 0 1 7 3.5Z',
  wifi: 'M2.5 8.5a15 15 0 0 1 19 0M6 12.2a10 10 0 0 1 12 0M9.4 15.9a5 5 0 0 1 5.2 0M12 19.5h.01',
  download: 'M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 19.5h15',
  sun: 'M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5ZM12 1.8v2.2M12 20v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M1.8 12H4M20 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6',
  moon: 'M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z',
  trash: 'M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5M10 10.5v6M14 10.5v6',
  warning: 'M12 4.2 2.8 19.8h18.4L12 4.2ZM12 10v4.2M12 17.2h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  image: 'M3.5 5.5h17v13h-17zM3.5 15.5 9 10l4.5 4.5L16 12l4.5 4.5M15.5 9.5h.01',
  swap: 'M7.5 4.5 4 8l3.5 3.5M4 8h11.5M16.5 19.5 20 16l-3.5-3.5M20 16H8.5',
  restore: 'M4.5 10.5A8 8 0 1 1 5 15M4.5 5v5.5H10',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'm4.5 12.5 5 5 10-11',
  spark: 'M12 3.5 14 9.6l6.1 2-6.1 2-2 6.1-2-6.1-6.1-2 6.1-2 2-6.1Z',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
