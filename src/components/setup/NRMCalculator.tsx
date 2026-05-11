import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { calculate1RM } from '../../core/calculator';

interface NRMCalculatorProps {
  onCalculate: (oneRepMax: number) => void;
  unit: string;
}

export function NRMCalculator({ onCalculate, unit }: NRMCalculatorProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const isValid = w > 0 && r > 0 && r <= 30;
  const estimated = isValid ? calculate1RM(w, r) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Enter a weight and the number of reps you completed to estimate your 1RM.
      </p>
      <Input
        label={`Weight (${unit})`}
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        placeholder="0"
      />
      <Input
        label="Reps completed"
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={e => setReps(e.target.value)}
        placeholder="0"
        min={1}
        max={30}
      />
      {isValid && (
        <div className="text-center py-2">
          <p className="text-sm text-[var(--color-text-secondary)]">Estimated 1RM</p>
          <p className="text-3xl font-bold text-[var(--color-primary)] tabular-nums">
            {Math.round(estimated * 10) / 10} {unit}
          </p>
        </div>
      )}
      <Button
        disabled={!isValid}
        onClick={() => onCalculate(Math.round(estimated * 10) / 10)}
        fullWidth
      >
        Use This 1RM
      </Button>
    </div>
  );
}
