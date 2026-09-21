import { useId } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Icon } from './Icon';

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
      {error ? (
        <p className="field__error" id={`${id}-error`} role="alert">
          <Icon name="warning" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
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
  options: ReadonlyArray<{ value: T; label: string; title?: string }>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <div className="field">
      <div className="slider__head">
        <span id={`${label}-legend`}>{label}</span>
      </div>
      <div className="segmented" role="radiogroup" aria-labelledby={`${label}-legend`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            title={option.title}
            className="segmented__option"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}
