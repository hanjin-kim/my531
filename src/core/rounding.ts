import type { Unit } from './types';

const KG_TO_LBS = 2.20462;

export function roundToIncrement(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment;
}

export function convertUnit(weight: number, from: Unit, to: Unit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * KG_TO_LBS : weight / KG_TO_LBS;
}
