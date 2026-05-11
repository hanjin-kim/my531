import { useState } from 'react';
import { Check } from 'lucide-react';
import type { WorkoutSet } from '../../core/types';

interface SetRowProps {
  set: WorkoutSet;
  unit: string;
  onComplete: (actualReps?: number) => void;
}

export function SetRow({ set, unit, onComplete }: SetRowProps) {
  const [amrapReps, setAmrapReps] = useState('');

  const typeLabel = set.setType === 'supplement' ? 'Suppl' : set.percentage ? `${set.percentage}%` : '';

  const handleComplete = () => {
    if (set.isAmrap) {
      const reps = parseInt(amrapReps, 10);
      if (reps > 0) onComplete(reps);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${set.isCompleted ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-surface-elevated)]'}`}>
      <div className="w-12 text-center">
        <span className="text-xs text-[var(--color-text-muted)]">{typeLabel}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums">{set.targetWeight}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{unit}</span>
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {set.targetReps}{set.isAmrap ? '+' : ''} reps
        </span>
      </div>

      {set.isAmrap && !set.isCompleted && (
        <input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={amrapReps}
          onChange={e => setAmrapReps(e.target.value)}
          className="w-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-center text-base tabular-nums outline-none focus:border-[var(--color-primary)]"
        />
      )}

      {set.isCompleted ? (
        <div className="w-11 h-11 flex items-center justify-center">
          <Check size={20} className="text-[var(--color-success)]" />
          {set.actualReps !== undefined && set.isAmrap && (
            <span className="text-xs text-[var(--color-success)] ml-0.5">{set.actualReps}</span>
          )}
        </div>
      ) : (
        <button
          onClick={handleComplete}
          disabled={set.isAmrap && !amrapReps}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--color-primary)] active:scale-95 transition-transform disabled:opacity-40"
        >
          <Check size={20} className="text-white" />
        </button>
      )}
    </div>
  );
}
