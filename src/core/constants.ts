import type { LiftName, WeekNumber } from './types';

export const LIFT_NAMES: readonly LiftName[] = ['squat', 'bench', 'deadlift', 'ohp'];
export const LOWER_BODY_LIFTS: readonly LiftName[] = ['squat', 'deadlift'];
export const UPPER_BODY_LIFTS: readonly LiftName[] = ['bench', 'ohp'];

export const LIFT_DISPLAY_NAMES: Record<LiftName, string> = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press',
};

export const DEFAULT_TM_PERCENTAGE = 85;
export const DEFAULT_ROUNDING_KG = 2.5;
export const DEFAULT_ROUNDING_LBS = 5;
export const DEFAULT_LEADER_CYCLES = 2;
export const DEFAULT_ANCHOR_CYCLES = 1;

export const TM_INCREASE = {
  kg: { upper: 2.5, lower: 5 },
  lbs: { upper: 5, lower: 10 },
} as const;

export const WEEK_PRESCRIPTIONS: Record<WeekNumber, [number, number, boolean][]> = {
  1: [[65, 5, false], [75, 5, false], [85, 5, true]],
  2: [[70, 3, false], [80, 3, false], [90, 3, true]],
  3: [[75, 5, false], [85, 3, false], [95, 1, true]],
  4: [[40, 5, false], [50, 5, false], [60, 5, false]],
};

export const WEEK_LABELS: Record<WeekNumber, string> = {
  1: '5/5/5+',
  2: '3/3/3+',
  3: '5/3/1+',
  4: 'Deload',
};

export const BBB_SETS = 5;
export const BBB_REPS = 10;
export const BBB_DEFAULT_PERCENTAGE = 50;

export const FSL_DEFAULT_SETS = 5;
export const FSL_DEFAULT_REPS = 5;
