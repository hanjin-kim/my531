import type { SeventhWeekProtocol, SeventhWeekChoice, LiftName } from '../../core/types';
import { db } from '../schema';

export async function createSeventhWeek(
  programId: number,
  afterCycleId: number,
  choice: SeventhWeekChoice,
): Promise<number> {
  const protocol: Omit<SeventhWeekProtocol, 'id'> = {
    programId,
    afterCycleId,
    choice,
  };
  return (await db.seventhWeekProtocols.add(protocol as SeventhWeekProtocol)) as number;
}

export async function getSeventhWeek(programId: number): Promise<SeventhWeekProtocol | undefined> {
  return db.seventhWeekProtocols.where('programId').equals(programId).last();
}

export async function recordTMTestResult(
  protocolId: number,
  liftName: LiftName,
  weight: number,
  reps: number,
  passed: boolean,
): Promise<void> {
  const protocol = await db.seventhWeekProtocols.get(protocolId);
  if (!protocol) return;

  const results = protocol.tmTestResults ?? {} as NonNullable<SeventhWeekProtocol['tmTestResults']>;
  results[liftName] = { weight, reps, passed };

  await db.seventhWeekProtocols.update(protocolId, { tmTestResults: results });
}

export async function completeSeventhWeek(protocolId: number): Promise<void> {
  await db.seventhWeekProtocols.update(protocolId, {
    completedAt: new Date().toISOString(),
  });
}
