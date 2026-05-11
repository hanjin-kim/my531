import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { completeSet, completeWorkout, startWorkout, getWorkoutSets } from '../db/repositories/workout.repo';
import { recordAMRAP, getBestE1RM } from '../db/repositories/history.repo';
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

  return {
    workoutDay,
    sets: sets ?? [],
    accessories: accessories ?? [],
    startWorkout: handleStartWorkout,
    completeSet: handleCompleteSet,
    completeWorkout: handleCompleteWorkout,
  };
}

export function useNextWorkout(programId: number | undefined) {
  return useLiveQuery(
    () => {
      if (!programId) return undefined;
      return db.workoutDays
        .where('programId').equals(programId)
        .filter((d: WorkoutDay) => d.status === 'pending' || d.status === 'in_progress')
        .first();
    },
    [programId],
  );
}
