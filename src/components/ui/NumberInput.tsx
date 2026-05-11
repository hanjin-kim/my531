import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}

export function NumberInput({ label, value, onChange, step = 1, min = 0, max = 999, unit }: NumberInputProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] active:scale-95 transition-transform"
        >
          <Minus size={18} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-xl font-semibold tabular-nums">{value}</span>
          {unit && <span className="text-sm text-[var(--color-text-secondary)] ml-1">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={increment}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] active:scale-95 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
