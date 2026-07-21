import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { completeSet, completeWorkout, startWorkout, getWorkoutSets, uncompleteSet, reopenWorkout } from '../db/repositories/workout.repo';
import { recordAMRAP, getBestE1RM, deleteAMRAP } from '../db/repositories/history.repo';
import { estimateE1RM } from '../core/calculator';
import type { WorkoutDay, WorkoutSet } from '../core/types';

export function useWorkout(workoutDayId: number | undefined) {
  const workoutDay = useLiveQuery(
    () => workoutDayId ? db.workoutDays.get(workoutDayId) : undefined,
    [workoutDayId],
  );

  const sets = useLiveQuery(
    () => workoutDayId ? getWorkoutSets(workoutDayId) : [],
    [workoutDayId],
  );

  const accessories = useLiveQuery(
    () => workoutDayId ? db.accessoryExercises.where('workoutDayId').equals(workoutDayId).toArray() : [],
    [workoutDayId],
  );

  async function handleStartWorkout() {
    if (workoutDayId && workoutDay?.status === 'pending') {
      await startWorkout(workoutDayId);
    }
  }

  async function handleCompleteSet(set: WorkoutSet, actualReps?: number): Promise<{ newRecord: boolean; e1rm: number } | undefined> {
    if (!set.id) return;
    await completeSet(set.id, actualReps ?? set.targetReps);

    if (set.isAmrap && actualReps && workoutDay) {
      const previousBest = await getBestE1RM(workoutDay.liftName);
      const newE1rm = estimateE1RM(set.targetWeight, actualReps);

      await recordAMRAP(
        workoutDay.programId,
        workoutDay.cycleId,
        workoutDay.liftName,
        workoutDay.week,
        set.targetWeight,
        set.targetReps,
        actualReps,
      );

      if (newE1rm > previousBest) {
        return { newRecord: true, e1rm: newE1rm };
      }
    }
  }

  async function handleCompleteWorkout() {
    if (workoutDayId) {
      await completeWorkout(workoutDayId);
    }
  }

  async function handleUncompleteSet(set: WorkoutSet) {
    if (!set.id) return;
    await uncompleteSet(set.id);
    // Drop the AMRAP history entry so the slot can be re-recorded cleanly on re-complete.
    if (set.isAmrap && workoutDay) {
      await deleteAMRAP(workoutDay.cycleId, workoutDay.liftName, workoutDay.week);
    }
  }

  async function handleReopenWorkout() {
    if (workoutDayId) {
      await reopenWorkout(workoutDayId);
    }
  }

  return {
    workoutDay,
    sets: sets ?? [],
    accessories: accessories ?? [],
    startWorkout: handleStartWorkout,
    completeSet: handleCompleteSet,
    completeWorkout: handleCompleteWorkout,
    uncompleteSet: handleUncompleteSet,
    reopenWorkout: handleReopenWorkout,
  };
}

export function useNextWorkout(cycleId: number | undefined) {
  return useLiveQuery(
    () => {
      if (!cycleId) return undefined;
      return db.workoutDays
        .where('cycleId').equals(cycleId)
        .filter((d: WorkoutDay) => d.status === 'pending' || d.status === 'in_progress')
        .first();
    },
    [cycleId],
  );
}
