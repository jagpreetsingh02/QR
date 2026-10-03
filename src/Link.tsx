import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate } from './router';

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

/** An anchor that navigates client-side unless the user asks for a new tab. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handleClick} {...rest} />;
}
