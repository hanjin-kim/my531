import type { Cycle } from '../../core/types';
import { db } from '../schema';

export async function getCurrentCycle(programId: number): Promise<Cycle | undefined> {
  const cycles = await db.cycles
    .where('programId').equals(programId)
    .sortBy('cycleIndex');
  return cycles[cycles.length - 1];
}

export async function getCyclesByProgram(programId: number): Promise<Cycle[]> {
  return db.cycles.where('programId').equals(programId).sortBy('cycleIndex');
}

export async function completeCycle(cycleId: number): Promise<void> {
  await db.cycles.update(cycleId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export async function getCycle(cycleId: number): Promise<Cycle | undefined> {
  return db.cycles.get(cycleId);
}
