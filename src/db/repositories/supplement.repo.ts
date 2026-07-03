import type { SupplementType, WorkoutSet } from '../../core/types';
import { db } from '../schema';
import { getActiveProgram } from './program.repo';
import { getCurrentCycle } from './cycle.repo';
import { getSettings } from './settings.repo';
import { getDefaultSupplementForCycle } from '../../core/program-engine';
import { generateSupplementSets } from '../../core/calculator';

/**
 * Regenerate supplement sets for the active cycle after the supplement type changes.
 *
 * Completed and skipped workout days are left untouched; every not-completed day
 * (pending or in_progress) has its supplement sets fully replaced — including any the
 * user had already logged this session. Warm-up and main sets are never touched, since
 * they don't depend on the supplement choice. Week 4 (deload) has no supplement work.
 *
 * The new sets honor the cycle's leader/anchor type (e.g. BBB is swapped to FSL on an
 * anchor cycle) and reuse the cycle's stored TM snapshots so weights stay consistent.
 */
export async function regenerateActiveCycleSupplements(newSupplement: SupplementType): Promise<void> {
  const program = await getActiveProgram();
  if (!program?.id) return;

  const cycle = await getCurrentCycle(program.id);
  if (!cycle?.id || cycle.status === 'completed') return;

  const settings = await getSettings();
  const supplementType = getDefaultSupplementForCycle(cycle.cycleIndex, program.leaderCycles, newSupplement);

  await db.transaction('rw', [db.cycles, db.workoutDays, db.workoutSets], async () => {
    await db.cycles.update(cycle.id!, { supplementType });

    const days = await db.workoutDays.where('cycleId').equals(cycle.id!).toArray();
    for (const day of days) {
      if (day.status === 'completed' || day.status === 'skipped' || day.week === 4) continue;

      const tm = cycle.tmSnapshots[day.liftName];
      if (tm == null) continue;

      const sets = await db.workoutSets.where('workoutDayId').equals(day.id!).toArray();
      const supplementIds = sets.filter(s => s.setType === 'supplement').map(s => s.id!);
      if (supplementIds.length) await db.workoutSets.bulkDelete(supplementIds);

      // Supplement sets always come last, so continue after the highest remaining index.
      let setIndex = sets
        .filter(s => s.setType !== 'supplement')
        .reduce((max, s) => Math.max(max, s.setIndex), -1) + 1;

      const prescriptions = generateSupplementSets(tm, day.week, supplementType, settings.roundingIncrement);
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
  });
}
