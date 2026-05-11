import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LIFT_DISPLAY_NAMES, WEEK_LABELS } from '../../core/constants';
import type { WorkoutDay } from '../../core/types';

interface NextWorkoutCardProps {
  workout: WorkoutDay;
}

export function NextWorkoutCard({ workout }: NextWorkoutCardProps) {
  const navigate = useNavigate();

  return (
    <Card onClick={() => navigate(`/workout/${workout.id}`)} className="border border-[var(--color-primary)]/30">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
          <Dumbbell size={24} className="text-[var(--color-primary)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-secondary)]">Next Workout</p>
          <p className="font-semibold text-lg">{LIFT_DISPLAY_NAMES[workout.liftName]}</p>
          <Badge variant="info">Week {workout.week} - {WEEK_LABELS[workout.week]}</Badge>
        </div>
        <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
      </div>
    </Card>
  );
}
