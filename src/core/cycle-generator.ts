import type { LiftName, SupplementType, WeekNumber, WorkoutDay, WorkoutSet } from './types';
import { LIFT_NAMES } from './constants';
import { generateMainSets, generateSupplementSets, generateWarmupSets } from './calculator';

/** Per-lift main-set style + supplement resolved for a cycle. */
export interface LiftCycleConfig {
  fivesPro: boolean;
  supplementType: SupplementType;
}

interface GenerateCycleOptions {
  bbbPercentage?: number;
  bbbSets?: number;
  fslSets?: number;
  fslReps?: number;
}

export function generateCycleWorkouts(
  cycleId: number,
  programId: number,
  tmSnapshots: Record<LiftName, number>,
  liftConfigs: Record<LiftName, LiftCycleConfig>,
  roundingIncrement: number,
  options?: GenerateCycleOptions & { skipDeload?: boolean },
): { workoutDays: Omit<WorkoutDay, 'id'>[]; workoutSets: Omit<WorkoutSet, 'id'>[] } {
  const workoutDays: Omit<WorkoutDay, 'id'>[] = [];
  const workoutSets: Omit<WorkoutSet, 'id'>[] = [];

  const weeks: WeekNumber[] = options?.skipDeload ? [1, 2, 3] : [1, 2, 3, 4];

  for (const week of weeks) {
    for (let dayIndex = 0; dayIndex < LIFT_NAMES.length; dayIndex++) {
      const liftName = LIFT_NAMES[dayIndex]!;
      const tm = tmSnapshots[liftName];
      const config = liftConfigs[liftName];
      const dayPlaceholderId = workoutDays.length;

      workoutDays.push({
        cycleId,
        programId,
        week,
        dayIndex,
        liftName,
        status: 'pending',
      });

      // Deload (week 4) is 40/50/60% x5 — already light enough to serve as its own
      // warm-up, so a separate warm-up ramp would just duplicate the main sets.
      const warmupSets = week === 4 ? [] : generateWarmupSets(tm, roundingIncrement);
      const mainSets = generateMainSets(tm, week, roundingIncrement, config.fivesPro);
      let setIndex = 0;

      for (const warmup of warmupSets) {
        workoutSets.push({
          workoutDayId: dayPlaceholderId,
          setIndex,
          setType: 'warmup',
          targetWeight: warmup.weight,
          targetReps: warmup.targetReps,
          isCompleted: false,
          isAmrap: false,
          percentage: warmup.percentage,
        });
        setIndex++;
      }

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
          tm, week, config.supplementType, roundingIncrement, options,
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
