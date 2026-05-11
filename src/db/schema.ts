import Dexie, { type EntityTable } from 'dexie';
import type {
  Settings, MainLift, Program, Cycle,
  WorkoutDay, WorkoutSet, AccessoryExercise,
  SeventhWeekProtocol, AMRAPRecord,
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
  }
}

export const db = new WendlerDB();
