import { QR_TYPES } from '../types';
import type { QrType } from '../types';
import { QR_TYPE_META } from '../lib/qrContent';
import { Icon } from './Icon';
import type { IconName } from './Icon';

interface TypeSelectorProps {
  value: QrType;
  onChange: (type: QrType) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <>
      <div className="types" role="radiogroup" aria-label="QR code type">
        {QR_TYPES.map((type) => {
          const meta = QR_TYPE_META[type];
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={value === type}
              className="type"
              onClick={() => onChange(type)}
            >
              <Icon name={meta.icon as IconName} size={20} />
              {meta.label}
            </button>
          );
        })}
      </div>
      <p className="types__description">{QR_TYPE_META[value].description}</p>
    </>
  );
}
