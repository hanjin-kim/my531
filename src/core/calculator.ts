import type { MainSetPrescription, SupplementSetPrescription, SupplementType, WeekNumber } from './types';
import { WEEK_PRESCRIPTIONS, BBB_SETS, BBB_REPS, BBB_DEFAULT_PERCENTAGE, FSL_DEFAULT_SETS, FSL_DEFAULT_REPS, WARMUP_PRESCRIPTIONS } from './constants';
import { roundToIncrement } from './rounding';

export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function calculateTM(oneRepMax: number, tmPercentage: number): number {
  return oneRepMax * tmPercentage / 100;
}

export function calculateWorkingWeight(
  trainingMax: number,
  percentage: number,
  roundingIncrement: number,
): number {
  return roundToIncrement(trainingMax * percentage / 100, roundingIncrement);
}

export function estimateE1RM(weight: number, reps: number): number {
  return calculate1RM(weight, reps);
}

export function generateWarmupSets(
  trainingMax: number,
  roundingIncrement: number,
): MainSetPrescription[] {
  return WARMUP_PRESCRIPTIONS.map(([percentage, targetReps]) => ({
    percentage,
    weight: calculateWorkingWeight(trainingMax, percentage, roundingIncrement),
    targetReps,
    isAmrap: false,
  }));
}

export function calculateAmrapTarget(amrapWeight: number, oneRepMax: number): number {
  if (amrapWeight <= 0 || oneRepMax <= 0) return 1;
  return Math.ceil(30 * (oneRepMax / amrapWeight - 1));
}

export function generateMainSets(
  trainingMax: number,
  week: WeekNumber,
  roundingIncrement: number,
  fivesPro = false,
): MainSetPrescription[] {
  const prescriptions = WEEK_PRESCRIPTIONS[week];
  return prescriptions.map(([percentage, targetReps, isAmrap]) => ({
    percentage,
    weight: calculateWorkingWeight(trainingMax, percentage, roundingIncrement),
    // 5s PRO: 5 straight reps on every main set, no AMRAP.
    targetReps: fivesPro ? 5 : targetReps,
    isAmrap: fivesPro ? false : isAmrap,
  }));
}

export function generateSupplementSets(
  trainingMax: number,
  week: WeekNumber,
  supplementType: SupplementType,
  roundingIncrement: number,
  options?: { bbbPercentage?: number; bbbSets?: number; fslSets?: number; fslReps?: number },
): SupplementSetPrescription[] {
  if (supplementType === 'none') return [];

  if (supplementType === 'bbb') {
    const pct = options?.bbbPercentage ?? BBB_DEFAULT_PERCENTAGE;
    return [{
      weight: calculateWorkingWeight(trainingMax, pct, roundingIncrement),
      targetReps: BBB_REPS,
      sets: options?.bbbSets ?? BBB_SETS,
    }];
  }

  const firstSetPercentage = WEEK_PRESCRIPTIONS[week][0]![0];
  return [{
    weight: calculateWorkingWeight(trainingMax, firstSetPercentage, roundingIncrement),
    targetReps: options?.fslReps ?? FSL_DEFAULT_REPS,
    sets: options?.fslSets ?? FSL_DEFAULT_SETS,
  }];
}
