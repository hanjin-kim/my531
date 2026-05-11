import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { Cycle, WorkoutDay } from '../../core/types';

interface CycleProgressProps {
  cycle: Cycle;
  workoutDays: WorkoutDay[];
}

export function CycleProgress({ cycle, workoutDays }: CycleProgressProps) {
  const completed = workoutDays.filter(d => d.status === 'completed' || d.status === 'skipped').length;
  const total = workoutDays.length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Cycle {cycle.cycleIndex + 1}</h3>
        <Badge variant={cycle.cycleType === 'leader' ? 'info' : 'warning'}>
          {cycle.cycleType === 'leader' ? 'Leader' : 'Anchor'}
        </Badge>
      </div>
      <ProgressBar value={completed} max={total} label={`${completed} / ${total} workouts`} />
    </Card>
  );
}
