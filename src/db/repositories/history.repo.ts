import type { AMRAPRecord, LiftName } from '../../core/types';
import { estimateE1RM } from '../../core/calculator';
import { db } from '../schema';

export async function recordAMRAP(
  programId: number,
  cycleId: number,
  liftName: LiftName,
  week: 1 | 2 | 3 | 4,
  weight: number,
  targetReps: number,
  actualReps: number,
): Promise<void> {
  const record: Omit<AMRAPRecord, 'id'> = {
    programId,
    cycleId,
    liftName,
    week,
    weight,
    targetReps,
    actualReps,
    e1rm: estimateE1RM(weight, actualReps),
    date: new Date().toISOString(),
  };
  // A workout day maps to a single (cycle, lift, week) AMRAP slot. Editing a completed
  // workout re-records that slot, so upsert instead of adding a duplicate history entry.
  const existing = await findAMRAP(cycleId, liftName, week);
  if (existing?.id !== undefined) {
    await db.amrapRecords.update(existing.id, record);
  } else {
    await db.amrapRecords.add(record as AMRAPRecord);
  }
}

async function findAMRAP(
  cycleId: number,
  liftName: LiftName,
  week: 1 | 2 | 3 | 4,
): Promise<AMRAPRecord | undefined> {
  return db.amrapRecords
    .where('cycleId').equals(cycleId)
    .filter(r => r.liftName === liftName && r.week === week)
    .first();
}

// Remove the AMRAP history entry for a slot — used when un-completing an AMRAP set.
export async function deleteAMRAP(
  cycleId: number,
  liftName: LiftName,
  week: 1 | 2 | 3 | 4,
): Promise<void> {
  const existing = await findAMRAP(cycleId, liftName, week);
  if (existing?.id !== undefined) {
    await db.amrapRecords.delete(existing.id);
  }
}

export async function getAMRAPHistory(liftName: LiftName): Promise<AMRAPRecord[]> {
  return db.amrapRecords
    .where('liftName').equals(liftName)
    .sortBy('date');
}

export async function getAllAMRAPHistory(): Promise<AMRAPRecord[]> {
  return db.amrapRecords.toArray();
}

export async function getCycleAMRAPs(cycleId: number): Promise<AMRAPRecord[]> {
  return db.amrapRecords.where('cycleId').equals(cycleId).toArray();
}

export async function getBestE1RM(liftName: LiftName): Promise<number> {
  const records = await db.amrapRecords.where('liftName').equals(liftName).toArray();
  return records.reduce((best, r) => Math.max(best, r.e1rm), 0);
}
