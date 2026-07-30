import Dexie, { type EntityTable } from 'dexie';
import type {
  Settings, MainLift, Program, Cycle,
  WorkoutDay, WorkoutSet, AccessoryExercise,
  SeventhWeekProtocol, AMRAPRecord, AccessoryPreset,
} from '../core/types';

export class WendlerDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>;
  mainLifts!: EntityTable<MainLift, 'id'>;
  programs!: EntityTable<Program, 'id'>;
  cycles!: EntityTable<Cycle, 'id'>;
  workoutDays!: EntityTable<WorkoutDay, 'id'>;
  workoutSets!: EntityTable<WorkoutSet, 'id'>;
  accessoryExercises!: EntityTable<AccessoryExercise, 'id'>;
  seventhWeekProtocols!: EntityTable<SeventhWeekProtocol, 'id'>;
  amrapRecords!: EntityTable<AMRAPRecord, 'id'>;
  accessoryPresets!: EntityTable<AccessoryPreset, 'id'>;

  constructor() {
    super('wendler531');
    this.version(1).stores({
      settings: 'id',
      mainLifts: '++id, name',
      programs: '++id, status',
      cycles: '++id, programId, [programId+cycleIndex]',
      workoutDays: '++id, cycleId, programId, [cycleId+week+dayIndex], status',
      workoutSets: '++id, workoutDayId, [workoutDayId+setIndex]',
      accessoryExercises: '++id, workoutDayId',
      seventhWeekProtocols: '++id, programId, afterCycleId',
      amrapRecords: '++id, programId, cycleId, liftName, [liftName+date]',
    });
    this.version(2).stores({
      accessoryPresets: '++id, name, category',
    });
    this.version(3).stores({}).upgrade(tx => {
      return tx.table('settings').toCollection().modify(s => {
        const upper = s.tmIncreaseUpper ?? (s.unit === 'lbs' ? 5 : 2.5);
        const lower = s.tmIncreaseLower ?? (s.unit === 'lbs' ? 10 : 5);
        s.tmIncrease = { squat: lower, bench: upper, deadlift: lower, ohp: upper };
        delete s.tmIncreaseUpper;
        delete s.tmIncreaseLower;
      });
    });
    this.version(4).stores({}).upgrade(tx => {
      return tx.table('settings').toCollection().modify(s => {
        s.bbbSets ??= 5;
        s.fslSets ??= 5;
      });
    });
    this.version(5).stores({}).upgrade(tx => {
      return tx.table('settings').toCollection().modify(s => {
        s.leaderFivesPro ??= false;
      });
    });
    // Per-lift main-set style + supplement. Backfill from the old global settings; the
    // former leader/anchor swap and global 5s PRO toggle are dropped (label only now).
    this.version(6).stores({}).upgrade(async tx => {
      const settings = await tx.table('settings').get(1);
      const supplement = settings?.defaultSupplement ?? 'bbb';
      const fivesPro = settings?.leaderFivesPro ?? false;
      await tx.table('mainLifts').toCollection().modify(l => {
        l.mainSetStyle ??= fivesPro ? '5spro' : '531';
        l.supplementType ??= supplement;
      });
    });
    // Deload (week 4) no longer generates warm-up sets — they duplicate the 40/50/60%
    // main sets. Strip the redundant warm-ups from existing not-yet-completed deload days
    // (completed ones are left alone to preserve history).
    this.version(7).stores({}).upgrade(async tx => {
      const deloadDays = await tx.table('workoutDays')
        .filter(d => d.week === 4 && d.status !== 'completed')
        .toArray();
      const dayIds = new Set(deloadDays.map(d => d.id));
      if (dayIds.size === 0) return;
      await tx.table('workoutSets')
        .filter(s => dayIds.has(s.workoutDayId) && s.setType === 'warmup')
        .delete();
    });
  }
}

export const db = new WendlerDB();
