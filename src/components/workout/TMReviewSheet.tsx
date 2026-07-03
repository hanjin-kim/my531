import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { LIFT_DISPLAY_NAMES } from '../../core/constants';
import type { LiftTMReview, TMDecision } from '../../core/progression';
import type { LiftName, Unit } from '../../core/types';

interface TMReviewSheetProps {
  open: boolean;
  reviews: LiftTMReview[];
  unit: Unit;
  onConfirm: (decisions: Record<LiftName, TMDecision>) => void;
}

const WEEK_SHORT: Record<number, string> = { 1: '5s', 2: '3s', 3: '1s' };

export function TMReviewSheet({ open, reviews, unit, onConfirm }: TMReviewSheetProps) {
  const [decisions, setDecisions] = useState<Record<string, TMDecision>>(() => {
    const initial: Record<string, TMDecision> = {};
    // Default to the lifter's own signal: reduce if they missed minimum reps, otherwise increase.
    for (const r of reviews) initial[r.liftName] = r.missedMin ? 'reduce' : 'increase';
    return initial;
  });

  const setDecision = (liftName: LiftName, decision: TMDecision) => {
    setDecisions(prev => ({ ...prev, [liftName]: decision }));
  };

  const resultingTM = (r: LiftTMReview, decision: TMDecision) =>
    decision === 'increase' ? r.increaseTM : decision === 'reduce' ? r.reducedTM : r.currentTM;

  const OPTIONS: { value: TMDecision; label: string; active: string }[] = [
    { value: 'increase', label: 'Increase', active: 'bg-[var(--color-success)] text-white' },
    { value: 'keep', label: 'Keep', active: 'bg-[var(--color-primary)] text-white' },
    { value: 'reduce', label: 'Reduce', active: 'bg-[var(--color-danger)] text-white' },
  ];

  return (
    <BottomSheet open={open} onClose={() => {}} title="Review Training Max">
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
        Cycle complete. Choose each lift's training max for the next cycle.
      </p>

      <div className="flex flex-col gap-3">
        {reviews.map(r => {
          const decision = decisions[r.liftName] ?? 'increase';
          const nextTM = resultingTM(r, decision);
          const amrapSummary = r.amraps
            .slice()
            .sort((a, b) => a.week - b.week)
            .map(a => `${WEEK_SHORT[a.week] ?? `W${a.week}`} ${a.actualReps}/${a.targetReps}+`)
            .join(' · ');

          return (
            <div key={r.liftName} className="bg-[var(--color-surface-elevated)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{LIFT_DISPLAY_NAMES[r.liftName]}</span>
                {r.missedMin && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium">
                    Missed minimum
                  </span>
                )}
              </div>

              {amrapSummary && (
                <p className="text-xs text-[var(--color-text-muted)] mb-1">
                  AMRAP: {amrapSummary}
                  {r.bestE1rm > 0 && <> · e1RM {Math.round(r.bestE1rm)} {unit}</>}
                </p>
              )}

              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                TM: {r.currentTM} {unit}
                <span
                  className={
                    decision === 'increase'
                      ? 'text-[var(--color-success)]'
                      : decision === 'reduce'
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-text-secondary)]'
                  }
                >
                  {' '}→ {nextTM} {unit}
                </span>
              </p>

              <div className="grid grid-cols-3 gap-2">
                {OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDecision(r.liftName, opt.value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      decision === opt.value
                        ? opt.active
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
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
