import * as m from 'motion/react-m';
import { QR_TYPES } from '../types';
import type { QrType } from '../types';
import { QR_TYPE_META } from '../lib/qrContent';
import { useRovingRadio } from '../hooks/useRovingRadio';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';

export function TypePicker({ value, onChange }: { value: QrType; onChange: (type: QrType) => void }) {
  const { onKeyDown, itemProps } = useRovingRadio(QR_TYPES, value, onChange);
  return (
    <div className="type-picker">
      <div className="type-picker__grid" role="radiogroup" aria-label="QR code type" onKeyDown={onKeyDown}>
        {QR_TYPES.map((type, i) => (
          <button key={type} type="button" className="type-picker__option" data-type={type} {...itemProps(i)} onClick={() => onChange(type)}>
            {type === value ? <m.span layoutId="type-picker-thumb" className="type-picker__thumb" /> : null}
            <span className="type-picker__chip">
              <Icon name={QR_TYPE_META[type].icon as IconName} size={18} />
            </span>
            <span className="type-picker__label">{QR_TYPE_META[type].label}</span>
          </button>
        ))}
      </div>
      <p className="type-picker__hint">{QR_TYPE_META[value].description}</p>
    </div>
  );
}
