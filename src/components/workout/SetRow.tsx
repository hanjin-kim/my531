import { useState } from 'react';
import { Check } from 'lucide-react';
import { repsToBeatE1RM } from '../../core/calculator';
import type { WorkoutSet } from '../../core/types';

interface SetRowProps {
  set: WorkoutSet;
  unit: string;
  prBaselineE1RM?: number;
  onComplete: (actualReps?: number) => void;
  // When provided, a completed set can be tapped to un-complete it (edit mode).
  onUncomplete?: () => void;
}

export function SetRow({ set, unit, prBaselineE1RM, onComplete, onUncomplete }: SetRowProps) {
  const [amrapReps, setAmrapReps] = useState('');

  const isWarmup = set.setType === 'warmup';
  const typeLabel = isWarmup ? 'W/U' : set.setType === 'supplement' ? 'Suppl' : set.percentage ? `${set.percentage}%` : '';
  // Reps needed to beat the current PR (best recorded e1RM) — matches the "New Record"
  // check in useWorkout, so hitting this target always registers a real PR.
  const amrapTarget = set.isAmrap && prBaselineE1RM !== undefined
    ? repsToBeatE1RM(set.targetWeight, prBaselineE1RM)
    : null;

  const handleComplete = () => {
    if (set.isAmrap) {
      const reps = parseInt(amrapReps, 10);
      if (reps > 0) onComplete(reps);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      set.isCompleted
        ? 'bg-[var(--color-success)]/10'
        : isWarmup
          ? 'bg-[var(--color-surface)]'
          : 'bg-[var(--color-surface-elevated)]'
    }`}>
      <div className="w-12 text-center">
        <span className={`text-xs ${isWarmup ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'}`}>{typeLabel}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`font-bold tabular-nums ${isWarmup ? 'text-base text-[var(--color-text-secondary)]' : 'text-lg'}`}>
            {set.targetWeight}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {set.targetReps}{set.isAmrap ? '+' : ''} reps
          </span>
          {amrapTarget !== null && amrapTarget > 0 && !set.isCompleted && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium">
              Target {amrapTarget}+
            </span>
          )}
        </div>
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
        onUncomplete ? (
          <button
            onClick={onUncomplete}
            aria-label="Undo set"
            className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
          >
            <Check size={20} className="text-[var(--color-success)]" />
            {set.actualReps !== undefined && set.isAmrap && (
              <span className="text-xs text-[var(--color-success)] ml-0.5">{set.actualReps}</span>
            )}
          </button>
        ) : (
          <div className="w-11 h-11 flex items-center justify-center">
            <Check size={20} className="text-[var(--color-success)]" />
            {set.actualReps !== undefined && set.isAmrap && (
              <span className="text-xs text-[var(--color-success)] ml-0.5">{set.actualReps}</span>
            )}
          </div>
        )
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
