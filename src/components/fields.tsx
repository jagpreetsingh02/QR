import { useId } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import * as m from 'motion/react-m';
import { Icon } from './Icon';
import { useRovingRadio } from '../hooks/useRovingRadio';

interface BaseFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

/** Wraps a control with its label, hint and inline error message. */
function FieldShell({
  label,
  id,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        {optional ? <span className="field__optional">optional</span> : null}
      </label>
      {children}
      {/* One message slot that always exists: errors replace hints in place, so nothing jumps. */}
      <p className={`field__message${error ? ' is-error' : ''}`} id={`${id}-message`} aria-live="polite">
        {error ? (
          <>
            <Icon name="alert" size={15} />
            <span>{error}</span>
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  return error || hint ? `${id}-message` : undefined;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  placeholder,
  autoComplete,
  type = 'text',
  inputMode,
}: BaseFieldProps & { type?: string; inputMode?: 'text' | 'email' | 'tel' | 'url' }) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        className="input"
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={type === 'text' ? undefined : false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, value, onChange, error, hint, optional, placeholder, rows = 4 }: BaseFieldProps & { rows?: number }) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        className="textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  error,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} error={error} hint={hint}>
      <select
        id={id}
        className="select"
        value={value}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch">
      <span className="switch__label">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch__track" aria-hidden="true" />
    </label>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <div className="slider__head">
        <label htmlFor={id}>{label}</label>
        <span className="slider__value">
          {value}
          {unit ?? ''}
        </span>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; detail?: string; title?: string }>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  const id = useId();
  const { onKeyDown, itemProps } = useRovingRadio(
    options.map((o) => o.value),
    value,
    onChange,
  );
  return (
    <div className="field">
      <span className="field__label" id={`${id}-legend`}>
        {label}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${id}-legend`} onKeyDown={onKeyDown}>
        {options.map((option, i) => (
          <button
            key={option.value}
            type="button"
            {...itemProps(i)}
            title={option.title}
            className="segmented__option"
            onClick={() => onChange(option.value)}
          >
            {value === option.value ? <m.span layoutId={`${id}-thumb`} className="segmented__thumb" /> : null}
            <span className="segmented__label">{option.label}</span>
            {option.detail ? <span className="segmented__detail">{option.detail}</span> : null}
          </button>
        ))}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}
