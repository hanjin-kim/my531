import type { LiftName, SupplementType, WeekNumber, WorkoutDay, WorkoutSet } from './types';
import { LIFT_NAMES } from './constants';
import { generateMainSets, generateSupplementSets } from './calculator';

interface GenerateCycleOptions {
  bbbPercentage?: number;
  fslSets?: number;
  fslReps?: number;
}

export function generateCycleWorkouts(
  cycleId: number,
  programId: number,
  tmSnapshots: Record<LiftName, number>,
  supplementType: SupplementType,
  roundingIncrement: number,
  options?: GenerateCycleOptions,
): { workoutDays: Omit<WorkoutDay, 'id'>[]; workoutSets: Omit<WorkoutSet, 'id'>[] } {
  const workoutDays: Omit<WorkoutDay, 'id'>[] = [];
  const workoutSets: Omit<WorkoutSet, 'id'>[] = [];

  const weeks: WeekNumber[] = [1, 2, 3, 4];

  for (const week of weeks) {
    for (let dayIndex = 0; dayIndex < LIFT_NAMES.length; dayIndex++) {
      const liftName = LIFT_NAMES[dayIndex]!;
      const tm = tmSnapshots[liftName];
      const dayPlaceholderId = workoutDays.length;

      workoutDays.push({
        cycleId,
        programId,
        week,
        dayIndex,
        liftName,
        status: 'pending',
      });

      const mainSets = generateMainSets(tm, week, roundingIncrement);
      let setIndex = 0;

      for (const set of mainSets) {
        workoutSets.push({
          workoutDayId: dayPlaceholderId,
          setIndex,
          setType: set.isAmrap ? 'amrap' : 'main',
          targetWeight: set.weight,
          targetReps: set.targetReps,
          isCompleted: false,
          isAmrap: set.isAmrap,
          percentage: set.percentage,
        });
        setIndex++;
      }

      if (week !== 4) {
        const supplementSets = generateSupplementSets(
          tm, week, supplementType, roundingIncrement, options,
        );
        for (const supp of supplementSets) {
          for (let s = 0; s < supp.sets; s++) {
            workoutSets.push({
              workoutDayId: dayPlaceholderId,
              setIndex,
              setType: 'supplement',
              targetWeight: supp.weight,
              targetReps: supp.targetReps,
              isCompleted: false,
              isAmrap: false,
            });
            setIndex++;
          }
        }
      }
    }
  }

  return { workoutDays, workoutSets };
}
