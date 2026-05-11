import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export function useCycle(programId: number | undefined) {
  const currentCycle = useLiveQuery(
    () => {
      if (!programId) return undefined;
      return db.cycles
        .where('programId').equals(programId)
        .reverse()
        .sortBy('cycleIndex')
        .then(cycles => cycles[0]);
    },
    [programId],
  );

  const workoutDays = useLiveQuery(
    () => {
      if (!currentCycle?.id) return [];
      return db.workoutDays.where('cycleId').equals(currentCycle.id).toArray();
    },
    [currentCycle?.id],
  );

  return { currentCycle, workoutDays: workoutDays ?? [] };
}
