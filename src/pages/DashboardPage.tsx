import { Header } from '../components/layout/Header';
import { CycleProgress } from '../components/dashboard/CycleProgress';
import { NextWorkoutCard } from '../components/dashboard/NextWorkoutCard';
import { LiftSummaryCard } from '../components/dashboard/LiftSummaryCard';
import { WeekOverview } from '../components/dashboard/WeekOverview';
import { EmptyState } from '../components/ui/EmptyState';
import { useProgram } from '../hooks/useProgram';
import { useCycle } from '../hooks/useCycle';
import { useNextWorkout } from '../hooks/useWorkout';
import { Dumbbell } from 'lucide-react';
import type { WeekNumber } from '../core/types';

export default function DashboardPage() {
  const { program, mainLifts } = useProgram();
  const { currentCycle, workoutDays } = useCycle(program?.id);
  const nextWorkout = useNextWorkout(program?.id);

  if (!program || !currentCycle) {
    return (
      <EmptyState
        icon={<Dumbbell size={48} />}
        title="No Active Program"
        description="Set up your lifts to begin."
      />
    );
  }

  const pendingDays = workoutDays.filter(d => d.status === 'pending' || d.status === 'in_progress');
  const currentWeek: WeekNumber = (pendingDays[0]?.week ?? 1) as WeekNumber;

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <Header title="Wendler 5/3/1" subtitle={`Cycle ${currentCycle.cycleIndex + 1} of ${program.totalCycles}`} />

      {nextWorkout && <NextWorkoutCard workout={nextWorkout} />}

      <CycleProgress cycle={currentCycle} workoutDays={workoutDays} />

      <div className="grid grid-cols-2 gap-3">
        {mainLifts.map(lift => (
          <LiftSummaryCard key={lift.id} lift={lift} />
        ))}
      </div>

      <WeekOverview workoutDays={workoutDays} currentWeek={currentWeek} />
    </div>
  );
}
