import type { LiftName, Unit } from './types';
import { LOWER_BODY_LIFTS, TM_INCREASE } from './constants';

export function calculateTMIncrease(liftName: LiftName, unit: Unit): number {
  const isLower = LOWER_BODY_LIFTS.includes(liftName);
  return isLower ? TM_INCREASE[unit].lower : TM_INCREASE[unit].upper;
}

export function applyTMIncrease(currentTM: number, liftName: LiftName, unit: Unit): number {
  return currentTM + calculateTMIncrease(liftName, unit);
}

export function reduceTM(currentTM: number, percentage: number = 10): number {
  return currentTM * (1 - percentage / 100);
}
