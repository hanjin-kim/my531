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
  }
}

export const db = new WendlerDB();
