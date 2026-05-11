import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { MainLift } from '../core/types';

export function useProgram() {
  const program = useLiveQuery(
    () => db.programs.where('status').equals('active').first(),
  );

  const mainLifts = useLiveQuery(async () => {
    const all = await db.mainLifts.toArray();
    const byName = new Map<string, MainLift>();
    for (const lift of all) {
      const existing = byName.get(lift.name);
      if (!existing || (lift.id ?? 0) > (existing.id ?? 0)) {
        byName.set(lift.name, lift);
      }
    }
    return Array.from(byName.values());
  });

  return { program, mainLifts: mainLifts ?? [] };
}
