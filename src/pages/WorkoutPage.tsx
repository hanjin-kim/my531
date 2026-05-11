import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { SetList } from '../components/workout/SetList';
import { AccessorySection } from '../components/workout/AccessorySection';
import { RestTimer } from '../components/workout/RestTimer';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkout } from '../hooks/useWorkout';
import { useSettings } from '../hooks/useSettings';
import { useWorkoutStore } from '../stores/workout.store';
import { isCycleComplete } from '../db/repositories/workout.repo';
import { completeCycle } from '../db/repositories/cycle.repo';
import { getCurrentCycle } from '../db/repositories/cycle.repo';
import { getActiveProgram } from '../db/repositories/program.repo';
import { advanceToNextCycle } from '../db/repositories/program.repo';
import { getSettings } from '../db/repositories/settings.repo';
import { db } from '../db/schema';
import type { WorkoutSet } from '../core/types';

export default function WorkoutPage() {
  const { workoutDayId } = useParams<{ workoutDayId: string }>();
  const navigate = useNavigate();
  const id = workoutDayId ? parseInt(workoutDayId, 10) : undefined;
  const { workoutDay, sets, accessories, startWorkout, completeSet, completeWorkout } = useWorkout(id);
  const { settings } = useSettings();
  const { startRestTimer } = useWorkoutStore();

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
    await completeSet(set, actualReps);
    startRestTimer(set.setType === 'supplement' ? 60 : 90);
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
            const result = await advanceToNextCycle(program, cycle, lifts, currentSettings);
            if (result.needsSeventhWeek) {
              navigate(`/seventh-week/${program.id}`, { replace: true });
              return;
            }
          }
        }
      }

      navigate('/', { replace: true });
    } catch (e) {
      console.error('Failed to finish workout:', e);
      alert('Failed to save workout. Please try again.');
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
          onCompleteSet={handleCompleteSet}
        />

        <AccessorySection
          workoutDayId={workoutDay.id!}
          accessories={accessories}
        />

        {allSetsComplete && (
          <Button onClick={handleFinish} fullWidth size="lg">
            Finish Workout
          </Button>
        )}
      </div>

      <RestTimer />
    </div>
  );
}
