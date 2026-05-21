import type { AMRAPRecord, LiftName, Unit } from './types';
import { LOWER_BODY_LIFTS, TM_INCREASE } from './constants';

export type TMDecision = 'increase' | 'keep' | 'reduce';

export interface AMRAPFailure {
  liftName: LiftName;
  week: number;
  targetReps: number;
  actualReps: number;
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
