import type { MainSetPrescription, TMTestResult, WeekNumber } from './types';
import { generateMainSets } from './calculator';

export function generateTMTestSets(
  trainingMax: number,
  roundingIncrement: number,
): MainSetPrescription[] {
  const warmupSets: MainSetPrescription[] = [
    { percentage: 70, weight: 0, targetReps: 5, isAmrap: false },
    { percentage: 80, weight: 0, targetReps: 3, isAmrap: false },
    { percentage: 90, weight: 0, targetReps: 1, isAmrap: false },
    { percentage: 100, weight: 0, targetReps: 3, isAmrap: true },
  ];

  return warmupSets.map((set) => ({
    ...set,
    weight: Math.round((trainingMax * set.percentage / 100) / roundingIncrement) * roundingIncrement,
  }));
}

export function evaluateTMTest(reps: number): TMTestResult {
  if (reps >= 5) return 'pass';
  if (reps >= 3) return 'marginal';
  return 'fail';
}

export function generateSeventhWeekDeload(
  trainingMax: number,
  roundingIncrement: number,
): MainSetPrescription[] {
  const deloadWeek: WeekNumber = 4;
  return generateMainSets(trainingMax, deloadWeek, roundingIncrement);
}
