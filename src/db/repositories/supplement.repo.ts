import type { LiftName, WorkoutSet } from '../../core/types';
import { db } from '../schema';
import { getActiveProgram } from './program.repo';
import { getCurrentCycle } from './cycle.repo';
import { getSettings } from './settings.repo';
import { generateSupplementSets, generateMainSets } from '../../core/calculator';

/**
 * Rebuild a lift's not-yet-started days in the active cycle after its per-lift config
 * (main-set style or supplement) changes, so the change takes effect now rather than only
 * from the next cycle.
 *
 * Only `pending` days are touched — completed and in-progress days keep their logged reps.
 * Main sets are updated in place (reps / AMRAP flag); supplement sets are replaced. Week 4
 * (deload) has no supplement work. Reads the lift's stored config, so call it after saving.
 */
export async function regenerateActiveCycleForLift(liftName: LiftName): Promise<void> {
  const program = await getActiveProgram();
  if (!program?.id) return;

  const cycle = await getCurrentCycle(program.id);
  if (!cycle?.id || cycle.status === 'completed') return;

  const lift = (await db.mainLifts.toArray()).find(l => l.name === liftName);
  if (!lift) return;

  const settings = await getSettings();
  const fivesPro = lift.mainSetStyle === '5spro';
  const supplementType = lift.supplementType;
  const options = { bbbSets: settings.bbbSets, fslSets: settings.fslSets };

  await db.transaction('rw', [db.workoutDays, db.workoutSets], async () => {
    const days = (await db.workoutDays.where('cycleId').equals(cycle.id!).toArray())
      .filter(d => d.liftName === liftName && d.status === 'pending');

    for (const day of days) {
      const tm = cycle.tmSnapshots[day.liftName];
      if (tm == null) continue;

      const sets = await db.workoutSets.where('workoutDayId').equals(day.id!).toArray();

      // Main sets: update in place (count is fixed at 3, so map 1:1 by index order).
      const mainPrescriptions = generateMainSets(tm, day.week, settings.roundingIncrement, fivesPro);
      const mainRows = sets
        .filter(s => s.setType === 'main' || s.setType === 'amrap')
        .sort((a, b) => a.setIndex - b.setIndex);
      for (let i = 0; i < mainRows.length && i < mainPrescriptions.length; i++) {
        const p = mainPrescriptions[i]!;
        await db.workoutSets.update(mainRows[i]!.id!, {
          setType: p.isAmrap ? 'amrap' : 'main',
          targetReps: p.targetReps,
          isAmrap: p.isAmrap,
          targetWeight: p.weight,
        });
      }

      // Supplement sets: replace (deload week has none).
      const supplementIds = sets.filter(s => s.setType === 'supplement').map(s => s.id!);
      if (supplementIds.length) await db.workoutSets.bulkDelete(supplementIds);

      if (day.week !== 4) {
        let setIndex = sets
          .filter(s => s.setType !== 'supplement')
          .reduce((max, s) => Math.max(max, s.setIndex), -1) + 1;

        const prescriptions = generateSupplementSets(tm, day.week, supplementType, settings.roundingIncrement, options);
        const newSets: Omit<WorkoutSet, 'id'>[] = [];
        for (const p of prescriptions) {
          for (let s = 0; s < p.sets; s++) {
            newSets.push({
              workoutDayId: day.id!,
              setIndex: setIndex++,
              setType: 'supplement',
              targetWeight: p.weight,
              targetReps: p.targetReps,
              isCompleted: false,
              isAmrap: false,
            });
          }
        }
        if (newSets.length) await db.workoutSets.bulkAdd(newSets as WorkoutSet[]);
      }
    }
  });
}

/** Rebuild every lift's pending days — used when a global setting (e.g. set counts) changes. */
export async function regenerateActiveCycleAllLifts(): Promise<void> {
  const lifts = await db.mainLifts.toArray();
  for (const lift of lifts) {
    await regenerateActiveCycleForLift(lift.name);
  }
}
