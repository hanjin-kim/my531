import { Badge } from '../ui/Badge';
import { LIFT_DISPLAY_NAMES, WEEK_LABELS } from '../../core/constants';
import type { WorkoutDay } from '../../core/types';

interface WorkoutHeaderProps {
  workout: WorkoutDay;
}

export function WorkoutHeader({ workout }: WorkoutHeaderProps) {
  return (
    <div className="text-center py-4">
      <Badge variant="info">Week {workout.week} - {WEEK_LABELS[workout.week]}</Badge>
      <h2 className="text-2xl font-bold mt-2">{LIFT_DISPLAY_NAMES[workout.liftName]}</h2>
    </div>
  );
}
