import { Card } from '../ui/Card';
import { LIFT_DISPLAY_NAMES } from '../../core/constants';
import type { MainLift } from '../../core/types';

interface LiftSummaryCardProps {
  lift: MainLift;
}

export function LiftSummaryCard({ lift }: LiftSummaryCardProps) {
  return (
    <Card>
      <p className="text-sm text-[var(--color-text-secondary)]">{LIFT_DISPLAY_NAMES[lift.name]}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold tabular-nums">{Math.round(lift.trainingMax * 10) / 10}</span>
        <span className="text-sm text-[var(--color-text-muted)]">{lift.unit} TM</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
        1RM: {Math.round(lift.oneRepMax * 10) / 10} {lift.unit}
      </p>
    </Card>
  );
}
