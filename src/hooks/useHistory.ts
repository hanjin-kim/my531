import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { LiftName } from '../core/types';

export function useAMRAPHistory(liftName?: LiftName) {
  return useLiveQuery(
    () => {
      if (!liftName) return db.amrapRecords.toArray();
      return db.amrapRecords.where('liftName').equals(liftName).sortBy('date');
    },
    [liftName],
  ) ?? [];
}

export function useCycleHistory() {
  return useLiveQuery(
    () => db.cycles.toArray(),
  ) ?? [];
}

export function useMainLiftHistory() {
  return useLiveQuery(
    () => db.mainLifts.toArray(),
  ) ?? [];
}
