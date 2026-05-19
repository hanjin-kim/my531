import type { Settings } from '../core/types';
import { DEFAULT_TM_PERCENTAGE, DEFAULT_ROUNDING_KG, DEFAULT_LEADER_CYCLES, DEFAULT_ANCHOR_CYCLES, TM_INCREASE } from '../core/constants';
import { db } from './schema';

export async function seedDefaults(): Promise<void> {
  const existing = await db.settings.get(1);
  if (existing) return;

  const now = new Date().toISOString();
  const defaults: Settings = {
    id: 1,
    unit: 'kg',
    tmPercentage: DEFAULT_TM_PERCENTAGE,
    roundingIncrement: DEFAULT_ROUNDING_KG,
    leaderCycles: DEFAULT_LEADER_CYCLES,
    anchorCycles: DEFAULT_ANCHOR_CYCLES,
    defaultSupplement: 'bbb',
    skipDeload: false,
    tmIncreaseUpper: TM_INCREASE.kg.upper,
    tmIncreaseLower: TM_INCREASE.kg.lower,
    createdAt: now,
    updatedAt: now,
  };

  await db.settings.put(defaults);
}
