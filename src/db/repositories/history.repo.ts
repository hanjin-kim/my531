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
  await db.amrapRecords.add(record as AMRAPRecord);
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
