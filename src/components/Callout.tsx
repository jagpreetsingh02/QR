import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export type CalloutTone = 'info' | 'warning' | 'danger' | 'success';

const ICONS: Record<CalloutTone, IconName> = {
  info: 'info',
  warning: 'warning',
  danger: 'warning',
  success: 'check',
};

export function Callout({ tone, children }: { tone: CalloutTone; children: ReactNode }) {
  return (
    <div className={`callout callout--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={ICONS[tone]} size={16} />
      <span>{children}</span>
    </div>
  );
}
