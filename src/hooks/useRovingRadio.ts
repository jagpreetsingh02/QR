import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * WAI-ARIA radio group keyboard model: one tab stop for the group, arrow
 * keys (and Home/End) move the selection and the focus together.
 */
export function useRovingRadio<T>(values: readonly T[], value: T, onChange: (next: T) => void) {
  const refs = useRef<Array<HTMLElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent) => {
    const current = Math.max(0, values.indexOf(value));
    let next: number;
    if (event.key in STEP) next = (current + STEP[event.key] + values.length) % values.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = values.length - 1;
    else return;
    event.preventDefault();
    onChange(values[next]);
    refs.current[next]?.focus();
  };

  const itemProps = (index: number) => ({
    ref: (el: HTMLElement | null) => {
      refs.current[index] = el;
    },
    role: 'radio' as const,
    'aria-checked': values[index] === value,
    tabIndex: values[index] === value ? 0 : -1,
  });

  return { onKeyDown, itemProps };
}
