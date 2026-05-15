import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, SkipForward } from 'lucide-react';
import { LIFT_DISPLAY_NAMES, WEEK_LABELS } from '../../core/constants';
import type { WeekNumber, WorkoutDay } from '../../core/types';

interface WeekOverviewProps {
  workoutDays: WorkoutDay[];
  currentWeek: WeekNumber;
  onSkipDeload?: () => void;
}

const statusIcon = {
  pending: <Clock size={14} className="text-[var(--color-text-muted)]" />,
  in_progress: <Clock size={14} className="text-[var(--color-warning)]" />,
  completed: <Check size={14} className="text-[var(--color-success)]" />,
  skipped: <SkipForward size={14} className="text-[var(--color-text-muted)]" />,
};

export function WeekOverview({ workoutDays, currentWeek, onSkipDeload }: WeekOverviewProps) {
  const navigate = useNavigate();
  const weeks: WeekNumber[] = [1, 2, 3, 4];
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef(0);

  const week13Done = workoutDays
    .filter(d => d.week !== 4)
    .every(d => d.status === 'completed' || d.status === 'skipped');
  const week4Pending = workoutDays.some(d => d.week === 4 && d.status === 'pending');
  const canSkip = week13Done && week4Pending && onSkipDeload;

  return (
    <div className="flex flex-col gap-3">
      {weeks.map(week => {
        const days = workoutDays.filter(d => d.week === week);
        if (days.length > 0 && days.every(d => d.status === 'skipped')) return null;
        const isCurrentWeek = week === currentWeek;
        const isDeload = week === 4;

        return (
          <div key={week} className="relative overflow-hidden rounded-xl">
            {isDeload && canSkip && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center">
                <button
                  onClick={() => { setSwiped(false); onSkipDeload(); }}
                  className="h-full px-5 bg-[var(--color-warning)] text-black font-semibold text-sm"
                >
                  Skip
                </button>
              </div>
            )}
            <div
              className={`relative p-3 transition-transform duration-200 ${isCurrentWeek ? 'bg-[var(--color-surface)] ring-1 ring-[var(--color-primary)]/30' : 'bg-[var(--color-surface)]'}`}
              style={{ transform: isDeload && swiped && canSkip ? 'translateX(-72px)' : 'translateX(0)' }}
              onTouchStart={e => { if (isDeload && canSkip) touchStart.current = e.touches[0]!.clientX; }}
              onTouchMove={e => { if (isDeload && canSkip && touchStart.current - e.touches[0]!.clientX > 50) setSwiped(true); }}
              onTouchEnd={() => { if (isDeload && canSkip && !swiped) setSwiped(false); }}
            >
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
          </div>
        );
      })}
    </div>
  );
}
