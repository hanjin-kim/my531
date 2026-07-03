import type { AMRAPRecord, LiftName, MainLift, Unit } from './types';
import { LOWER_BODY_LIFTS, TM_INCREASE } from './constants';

export type TMDecision = 'increase' | 'keep' | 'reduce';

export interface AMRAPFailure {
  liftName: LiftName;
  week: number;
  targetReps: number;
  actualReps: number;
}

export interface LiftTMReview {
  liftName: LiftName;
  currentTM: number;
  increaseTM: number;
  reducedTM: number;
  amraps: { week: number; targetReps: number; actualReps: number }[];
  bestE1rm: number;
  missedMin: boolean;
}

/**
 * Build the per-lift training-max review shown at the end of every cycle. The lifter
 * decides increase/keep/reduce for each lift; this surfaces the AMRAP results and the
 * resulting TM for each choice so the decision is informed by actual performance.
 */
export function buildTMReviews(
  lifts: MainLift[],
  amraps: AMRAPRecord[],
  unit: Unit,
  tmIncrease?: Partial<Record<LiftName, number>>,
): LiftTMReview[] {
  return lifts.map(lift => {
    const liftAmraps = amraps.filter(a => a.liftName === lift.name);
    return {
      liftName: lift.name,
      currentTM: lift.trainingMax,
      increaseTM: applyTMIncrease(lift.trainingMax, lift.name, unit, tmIncrease),
      reducedTM: Math.round(reduceTM(lift.trainingMax) * 100) / 100,
      amraps: liftAmraps.map(a => ({ week: a.week, targetReps: a.targetReps, actualReps: a.actualReps })),
      bestE1rm: liftAmraps.reduce((b, a) => Math.max(b, a.e1rm), 0),
      missedMin: liftAmraps.some(a => a.actualReps < a.targetReps),
    };
  });
}

export function calculateTMIncrease(
  liftName: LiftName,
  unit: Unit,
  perLift?: Partial<Record<LiftName, number>>,
): number {
  if (perLift?.[liftName] !== undefined) {
    return perLift[liftName];
  }
  const isLower = LOWER_BODY_LIFTS.includes(liftName);
  return isLower ? TM_INCREASE[unit].lower : TM_INCREASE[unit].upper;
}

export function applyTMIncrease(
  currentTM: number,
  liftName: LiftName,
  unit: Unit,
  perLift?: Partial<Record<LiftName, number>>,
): number {
  return currentTM + calculateTMIncrease(liftName, unit, perLift);
}

export function reduceTM(currentTM: number, percentage: number = 10): number {
  return currentTM * (1 - percentage / 100);
}

export function evaluateAMRAPResults(records: AMRAPRecord[]): AMRAPFailure[] {
  const worstByLift = new Map<LiftName, AMRAPFailure>();

  for (const r of records) {
    if (r.actualReps >= r.targetReps) continue;

    const existing = worstByLift.get(r.liftName);
    const ratio = r.actualReps / r.targetReps;
    if (!existing || ratio < existing.actualReps / existing.targetReps) {
      worstByLift.set(r.liftName, {
        liftName: r.liftName,
        week: r.week,
        targetReps: r.targetReps,
        actualReps: r.actualReps,
      });
    }
  }

  return Array.from(worstByLift.values());
}
