import type { WorkoutDay, WorkoutSet } from '../../core/types';
import { db } from '../schema';

export async function getWorkoutDay(workoutDayId: number): Promise<WorkoutDay | undefined> {
  return db.workoutDays.get(workoutDayId);
}

export async function getWorkoutsByWeek(cycleId: number, week: number): Promise<WorkoutDay[]> {
  return db.workoutDays
    .where('[cycleId+week+dayIndex]')
    .between([cycleId, week, 0], [cycleId, week, 99])
    .toArray();
}

export async function getWorkoutsByCycle(cycleId: number): Promise<WorkoutDay[]> {
  return db.workoutDays.where('cycleId').equals(cycleId).toArray();
}

export async function getNextPendingWorkout(programId: number): Promise<WorkoutDay | undefined> {
  return db.workoutDays
    .where('programId').equals(programId)
    .filter(d => d.status === 'pending' || d.status === 'in_progress')
    .first();
}

export async function getWorkoutSets(workoutDayId: number): Promise<WorkoutSet[]> {
  return db.workoutSets
    .where('workoutDayId').equals(workoutDayId)
    .sortBy('setIndex');
}

export async function startWorkout(workoutDayId: number): Promise<void> {
  await db.workoutDays.update(workoutDayId, {
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  });
}

export async function completeSet(setId: number, actualReps?: number): Promise<void> {
  await db.workoutSets.update(setId, {
    isCompleted: true,
    actualReps,
    completedAt: new Date().toISOString(),
  });
}

export async function uncompleteSet(setId: number): Promise<void> {
  await db.workoutSets.update(setId, {
    isCompleted: false,
    actualReps: undefined,
    completedAt: undefined,
  });
}

// Reopen a completed (or skipped) workout for editing without wiping any set data.
export async function reopenWorkout(workoutDayId: number): Promise<void> {
  await db.workoutDays.update(workoutDayId, {
    status: 'in_progress',
    completedAt: undefined,
  });
}

export async function completeWorkout(workoutDayId: number): Promise<void> {
  await db.workoutDays.update(workoutDayId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export async function skipWorkout(workoutDayId: number): Promise<void> {
  await db.workoutDays.update(workoutDayId, {
    status: 'skipped',
    completedAt: new Date().toISOString(),
  });
}

export async function isCycleComplete(cycleId: number): Promise<boolean> {
  const pending = await db.workoutDays
    .where('cycleId').equals(cycleId)
    .filter(d => d.status === 'pending' || d.status === 'in_progress')
    .count();
  return pending === 0;
}
