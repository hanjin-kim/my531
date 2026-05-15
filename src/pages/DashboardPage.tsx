import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { CycleProgress } from '../components/dashboard/CycleProgress';
import { NextWorkoutCard } from '../components/dashboard/NextWorkoutCard';
import { LiftSummaryCard } from '../components/dashboard/LiftSummaryCard';
import { WeekOverview } from '../components/dashboard/WeekOverview';
import { TMReviewSheet } from '../components/workout/TMReviewSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useProgram } from '../hooks/useProgram';
import { useCycle } from '../hooks/useCycle';
import { useNextWorkout } from '../hooks/useWorkout';
import { useSettings } from '../hooks/useSettings';
import { db } from '../db/schema';
import { completeCycle, getCurrentCycle } from '../db/repositories/cycle.repo';
import { getCycleAMRAPs } from '../db/repositories/history.repo';
import { advanceToNextCycle, getActiveProgram } from '../db/repositories/program.repo';
import { getSettings } from '../db/repositories/settings.repo';
import { evaluateAMRAPResults, type AMRAPFailure, type TMDecision } from '../core/progression';
import { Dumbbell } from 'lucide-react';
import type { Cycle, LiftName, MainLift, Program, Settings, WeekNumber } from '../core/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { program, mainLifts } = useProgram();
  const { currentCycle, workoutDays } = useCycle(program?.id);
  const nextWorkout = useNextWorkout(program?.id);
  const { settings } = useSettings();
  const [tmReview, setTmReview] = useState<{
    failures: AMRAPFailure[];
    program: Program;
    cycle: Cycle;
    lifts: MainLift[];
    settings: Settings;
  } | null>(null);

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

  const doAdvance = async (
    prog: Program,
    cyc: Cycle,
    lifts: MainLift[],
    s: Settings,
    tmDecisions?: Partial<Record<LiftName, TMDecision>>,
  ) => {
    const result = await advanceToNextCycle(prog, cyc, lifts, s, tmDecisions);
    if (result.needsSeventhWeek) {
      navigate(`/seventh-week/${prog.id}`, { replace: true });
    }
  };

  const handleSkipDeload = async () => {
    if (!currentCycle?.id || !program) return;
    const week4Days = await db.workoutDays
      .where('cycleId').equals(currentCycle.id)
      .filter(d => d.week === 4 && d.status === 'pending')
      .toArray();
    for (const day of week4Days) {
      await db.workoutDays.update(day.id!, { status: 'skipped' });
    }

    await completeCycle(currentCycle.id);
    const freshProgram = await getActiveProgram();
    if (!freshProgram) return;
    const cycle = await getCurrentCycle(freshProgram.id!);
    const currentSettings = await getSettings();
    const lifts = await db.mainLifts.toArray();
    if (!cycle) return;

    const amraps = await getCycleAMRAPs(currentCycle.id);
    const failures = evaluateAMRAPResults(amraps);
    if (failures.length > 0) {
      setTmReview({ failures, program: freshProgram, cycle, lifts, settings: currentSettings });
      return;
    }

    await doAdvance(freshProgram, cycle, lifts, currentSettings);
  };

  const handleTMReviewConfirm = async (decisions: Record<LiftName, TMDecision>) => {
    if (!tmReview) return;
    await doAdvance(tmReview.program, tmReview.cycle, tmReview.lifts, tmReview.settings, decisions);
    setTmReview(null);
  };

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <Header title="5/3/1" subtitle={`Cycle ${currentCycle.cycleIndex + 1} of ${program.totalCycles}`} />

      {nextWorkout && <NextWorkoutCard workout={nextWorkout} />}

      <CycleProgress cycle={currentCycle} workoutDays={workoutDays} />

      <div className="grid grid-cols-2 gap-3">
        {mainLifts.map(lift => (
          <LiftSummaryCard key={lift.id} lift={lift} />
        ))}
      </div>

      <WeekOverview workoutDays={workoutDays} currentWeek={currentWeek} onSkipDeload={handleSkipDeload} />

      <p className="text-center text-xs text-[var(--color-text-muted)] pb-4">v{__APP_VERSION__}</p>

      {tmReview && settings && (
        <TMReviewSheet
          open
          failures={tmReview.failures}
          unit={settings.unit}
          currentTMs={Object.fromEntries(tmReview.lifts.map(l => [l.name, l.trainingMax])) as Record<LiftName, number>}
          onConfirm={handleTMReviewConfirm}
        />
      )}
    </div>
  );
}
