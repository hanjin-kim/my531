import { useNavigate } from 'react-router-dom';
import { Check, Clock, SkipForward } from 'lucide-react';
import { LIFT_DISPLAY_NAMES, WEEK_LABELS } from '../../core/constants';
import type { WeekNumber, WorkoutDay } from '../../core/types';

interface WeekOverviewProps {
  workoutDays: WorkoutDay[];
  currentWeek: WeekNumber;
}

const statusIcon = {
  pending: <Clock size={14} className="text-[var(--color-text-muted)]" />,
  in_progress: <Clock size={14} className="text-[var(--color-warning)]" />,
  completed: <Check size={14} className="text-[var(--color-success)]" />,
  skipped: <SkipForward size={14} className="text-[var(--color-text-muted)]" />,
};

export function WeekOverview({ workoutDays, currentWeek }: WeekOverviewProps) {
  const navigate = useNavigate();
  const weeks: WeekNumber[] = [1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-3">
      {weeks.map(week => {
        const days = workoutDays.filter(d => d.week === week);
        if (days.length > 0 && days.every(d => d.status === 'skipped')) return null;
        const isCurrentWeek = week === currentWeek;

        return (
          <div key={week} className={`rounded-xl p-3 ${isCurrentWeek ? 'bg-[var(--color-surface)] ring-1 ring-[var(--color-primary)]/30' : 'bg-[var(--color-surface)]'}`}>
            <p className={`text-xs font-medium mb-2 ${isCurrentWeek ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              Week {week} - {WEEK_LABELS[week]}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {days.map(day => (
                <button
                  key={day.id}
                  onClick={() => day.id && navigate(`/workout/${day.id}`)}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
                >
                  {statusIcon[day.status]}
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {LIFT_DISPLAY_NAMES[day.liftName].slice(0, 5)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
