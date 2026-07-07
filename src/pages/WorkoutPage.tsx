import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { SetList } from '../components/workout/SetList';
import { AccessorySection } from '../components/workout/AccessorySection';
import { RestTimer } from '../components/workout/RestTimer';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast } from '../components/ui/Toast';
import { TMReviewSheet } from '../components/workout/TMReviewSheet';
import { useWorkout } from '../hooks/useWorkout';
import { useSettings } from '../hooks/useSettings';
import { useWorkoutStore } from '../stores/workout.store';
import { isCycleComplete } from '../db/repositories/workout.repo';
import { completeCycle } from '../db/repositories/cycle.repo';
import { getCurrentCycle } from '../db/repositories/cycle.repo';
import { getCycleAMRAPs, getBestE1RM } from '../db/repositories/history.repo';
import { getActiveProgram } from '../db/repositories/program.repo';
import { advanceToNextCycle } from '../db/repositories/program.repo';
import { getSettings } from '../db/repositories/settings.repo';
import { buildTMReviews, type LiftTMReview, type TMDecision } from '../core/progression';
import { db } from '../db/schema';
import type { Cycle, LiftName, MainLift, Program, Settings, WorkoutSet } from '../core/types';

export default function WorkoutPage() {
  const { workoutDayId } = useParams<{ workoutDayId: string }>();
  const navigate = useNavigate();
  const id = workoutDayId ? parseInt(workoutDayId, 10) : undefined;
  const { workoutDay, sets, accessories, startWorkout, completeSet, completeWorkout } = useWorkout(id);
  const { settings } = useSettings();
  const { startRestTimer } = useWorkoutStore();
  const [toast, setToast] = useState<{ message: string; subtext?: string } | null>(null);
  const [tmReview, setTmReview] = useState<{
    reviews: LiftTMReview[];
    program: Program;
    cycle: Cycle;
    lifts: MainLift[];
    settings: Settings;
  } | null>(null);

  const bestE1RM = useLiveQuery(
    () => workoutDay ? getBestE1RM(workoutDay.liftName) : undefined,
    [workoutDay?.liftName],
  );

  useEffect(() => {
    if (workoutDay?.status === 'pending') {
      startWorkout();
    }
  }, [workoutDay?.status, startWorkout]);

  if (!workoutDay || !settings) {
    return <EmptyState title="Workout not found" description="Select a workout from the dashboard." />;
  }

  const allSetsComplete = sets.length > 0 && sets.every(s => s.isCompleted);

  const handleCompleteSet = async (set: WorkoutSet, actualReps?: number) => {
    const result = await completeSet(set, actualReps);
    if (result?.newRecord) {
      setToast({
        message: '🏆 New Record!',
        subtext: `Estimated 1RM: ${Math.round(result.e1rm)} ${settings.unit}`,
      });
    }
    startRestTimer(set.setType === 'supplement' ? 60 : 90);
  };

  const doAdvance = async (
    program: Program,
    cycle: Cycle,
    lifts: MainLift[],
    currentSettings: Settings,
    tmDecisions?: Partial<Record<LiftName, TMDecision>>,
  ) => {
    const result = await advanceToNextCycle(program, cycle, lifts, currentSettings, tmDecisions);
    if (result.needsSeventhWeek) {
      navigate(`/seventh-week/${program.id}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleFinish = async () => {
    try {
      await completeWorkout();

      const cycleComplete = await isCycleComplete(workoutDay.cycleId);
      if (cycleComplete) {
        await completeCycle(workoutDay.cycleId);

        const program = await getActiveProgram();
        if (program) {
          const cycle = await getCurrentCycle(program.id!);
          const currentSettings = await getSettings();
          const lifts = await db.mainLifts.toArray();
          if (cycle) {
            const amraps = await getCycleAMRAPs(workoutDay.cycleId);
            const reviews: LiftTMReview[] = buildTMReviews(lifts, amraps, currentSettings.unit, currentSettings.tmIncrease);

            setTmReview({ reviews, program, cycle, lifts, settings: currentSettings });
            return;
          }
        }
      }

      navigate('/', { replace: true });
    } catch (e) {
      console.error('Failed to finish workout:', e);
      alert('Failed to save workout. Please try again.');
    }
  };

  const handleTMReviewConfirm = async (decisions: Record<LiftName, TMDecision>) => {
    if (!tmReview) return;
    try {
      await doAdvance(tmReview.program, tmReview.cycle, tmReview.lifts, tmReview.settings, decisions);
    } catch (e) {
      console.error('Failed to advance cycle:', e);
      alert('Failed to save. Please try again.');
    } finally {
      setTmReview(null);
    }
  };

  return (
    <div className="min-h-full px-4 pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 py-3 text-[var(--color-primary)]">
        <ArrowLeft size={18} /> Back
      </button>

      <WorkoutHeader workout={workoutDay} />

      <div className="flex flex-col gap-6 mt-4">
        <SetList
          sets={sets}
          unit={settings.unit}
          prBaselineE1RM={bestE1RM}
          onCompleteSet={handleCompleteSet}
        />

        <AccessorySection
          workoutDayId={workoutDay.id!}
          accessories={accessories}
        />

        <Button
          onClick={handleFinish}
          fullWidth
          size="lg"
          variant={allSetsComplete ? 'primary' : 'secondary'}
        >
          {allSetsComplete ? 'Finish Workout' : 'Finish Early'}
        </Button>
      </div>

      <RestTimer />

      <Toast
        message={toast?.message ?? ''}
        subtext={toast?.subtext}
        visible={toast !== null}
        onDismiss={() => setToast(null)}
      />

      {tmReview && (
        <TMReviewSheet
          open
          reviews={tmReview.reviews}
          unit={settings.unit}
          onConfirm={handleTMReviewConfirm}
        />
      )}
    </div>
  );
}
