import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { LIFT_DISPLAY_NAMES } from '../../core/constants';
import { reduceTM, type AMRAPFailure, type TMDecision } from '../../core/progression';
import type { LiftName, Unit } from '../../core/types';

interface TMReviewSheetProps {
  open: boolean;
  failures: AMRAPFailure[];
  unit: Unit;
  currentTMs: Record<LiftName, number>;
  onConfirm: (decisions: Record<LiftName, TMDecision>) => void;
}

export function TMReviewSheet({ open, failures, unit, currentTMs, onConfirm }: TMReviewSheetProps) {
  const [decisions, setDecisions] = useState<Record<string, TMDecision>>(() => {
    const initial: Record<string, TMDecision> = {};
    for (const f of failures) initial[f.liftName] = 'reduce';
    return initial;
  });

  const toggle = (liftName: LiftName) => {
    setDecisions(prev => ({
      ...prev,
      [liftName]: prev[liftName] === 'reduce' ? 'keep' : 'reduce',
    }));
  };

  return (
    <BottomSheet open={open} onClose={() => {}} title="Review Training Max">
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
        Some lifts didn't hit minimum reps this cycle.
      </p>

      <div className="flex flex-col gap-3">
        {failures.map(f => {
          const decision = decisions[f.liftName] ?? 'reduce';
          const currentTM = currentTMs[f.liftName];
          const reducedTM = Math.round(reduceTM(currentTM) * 100) / 100;

          return (
            <div key={f.liftName} className="bg-[var(--color-surface-elevated)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{LIFT_DISPLAY_NAMES[f.liftName]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium">
                  {f.actualReps}/{f.targetReps}+ reps
                </span>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Current TM: {currentTM} {unit}
                {decision === 'reduce' && (
                  <span className="text-[var(--color-danger)]"> → {reducedTM} {unit}</span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggle(f.liftName)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    decision === 'keep'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Keep TM
                </button>
                <button
                  onClick={() => toggle(f.liftName)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    decision === 'reduce'
                      ? 'bg-[var(--color-danger)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Reduce 10%
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Button
          onClick={() => onConfirm(decisions as Record<LiftName, TMDecision>)}
          fullWidth
          size="lg"
        >
          Confirm & Continue
        </Button>
      </div>
    </BottomSheet>
  );
}
