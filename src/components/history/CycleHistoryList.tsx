import { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Check, Clock, SkipForward, ChevronDown } from 'lucide-react';
import { db } from '../../db/schema';
import { LIFT_NAMES, LIFT_DISPLAY_NAMES, WEEK_LABELS } from '../../core/constants';
import type { AMRAPRecord, Cycle, LiftName, WeekNumber, WorkoutDay } from '../../core/types';

interface CycleHistoryListProps {
  cycles: Cycle[];
  unit: string;
}

const statusIcon = {
  pending: <Clock size={12} className="text-[var(--color-text-muted)]" />,
  in_progress: <Clock size={12} className="text-[var(--color-warning)]" />,
  completed: <Check size={12} className="text-[var(--color-success)]" />,
  skipped: <SkipForward size={12} className="text-[var(--color-text-muted)]" />,
};

function CycleDetail({ cycle, unit }: { cycle: Cycle; unit: string }) {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [amraps, setAmraps] = useState<AMRAPRecord[]>([]);

  useEffect(() => {
    if (!cycle.id) return;
    db.workoutDays.where('cycleId').equals(cycle.id).toArray().then(setDays);
    db.amrapRecords.where('cycleId').equals(cycle.id).toArray().then(setAmraps);
  }, [cycle.id]);

  const weeks = [1, 2, 3, 4] as WeekNumber[];
  const amrapMap = new Map<string, AMRAPRecord>();
  for (const r of amraps) {
    amrapMap.set(`${r.liftName}-${r.week}`, r);
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col gap-3">
      {weeks.map(week => {
        const weekDays = days.filter(d => d.week === week);
        if (weekDays.length === 0) return null;
        if (weekDays.every(d => d.status === 'skipped')) return null;

        return (
          <div key={week}>
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase mb-1.5">
              Week {week} - {WEEK_LABELS[week]}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {weekDays.map(day => {
                const amrap = amrapMap.get(`${day.liftName}-${day.week}`);
                return (
                  <div key={day.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[day.status]}
                      <span className="text-[var(--color-text-secondary)]">
                        {LIFT_DISPLAY_NAMES[day.liftName].slice(0, 5)}
                      </span>
                    </div>
                    {amrap && (
                      <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
                        {amrap.actualReps}r · {Math.round(amrap.e1rm)}{unit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {amraps.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase mb-1.5">
            Best AMRAP e1RM
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {LIFT_NAMES.map(name => {
              const liftAmraps = amraps.filter(a => a.liftName === name);
              if (liftAmraps.length === 0) return null;
              const best = liftAmraps.reduce((b, a) => a.e1rm > b.e1rm ? a : b);
              return (
                <div key={name} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{LIFT_DISPLAY_NAMES[name].slice(0, 5)}</span>
                  <span className="tabular-nums text-emerald-400">{Math.round(best.e1rm)} {unit}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CycleHistoryList({ cycles, unit }: CycleHistoryListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (cycles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Cycle History</p>
      {[...cycles].reverse().map(cycle => {
        const isExpanded = expandedId === cycle.id;
        return (
          <Card key={cycle.id} onClick={() => setExpandedId(isExpanded ? null : cycle.id!)}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Cycle {cycle.cycleIndex + 1}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant={cycle.cycleType === 'leader' ? 'info' : 'warning'}>
                  {cycle.cycleType}
                </Badge>
                <Badge variant={cycle.status === 'completed' ? 'success' : 'default'}>
                  {cycle.status}
                </Badge>
                <ChevronDown
                  size={16}
                  className={`text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {LIFT_NAMES.map(name => (
                <div key={name} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{LIFT_DISPLAY_NAMES[name].slice(0, 5)}</span>
                  <span className="tabular-nums">{Math.round(cycle.tmSnapshots[name])} {unit}</span>
                </div>
              ))}
            </div>
            {isExpanded && <CycleDetail cycle={cycle} unit={unit} />}
          </Card>
        );
      })}
    </div>
  );
}
