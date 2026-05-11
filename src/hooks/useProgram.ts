import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export function useProgram() {
  const program = useLiveQuery(
    () => db.programs.where('status').equals('active').first(),
  );

  const mainLifts = useLiveQuery(
    () => db.mainLifts.toArray(),
  );

  return { program, mainLifts: mainLifts ?? [] };
}
