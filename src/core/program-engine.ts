import type {
  Cycle, LiftName, MainLift, Program, Settings,
  SupplementType, WorkoutDay, WorkoutSet,
} from './types';
import { LIFT_NAMES } from './constants';
import { generateCycleWorkouts } from './cycle-generator';
import { applyTMIncrease } from './progression';

function getSupplementForCycle(
  cycleIndex: number,
  leaderCycles: number,
  defaultSupplement: SupplementType,
): { cycleType: 'leader' | 'anchor'; supplementType: SupplementType } {
  const isLeader = cycleIndex < leaderCycles;
  return {
    cycleType: isLeader ? 'leader' : 'anchor',
    supplementType: isLeader ? defaultSupplement : (defaultSupplement === 'bbb' ? 'fsl' : defaultSupplement),
  };
}

function buildTMSnapshots(mainLifts: MainLift[]): Record<LiftName, number> {
  const snapshots = {} as Record<LiftName, number>;
  for (const lift of mainLifts) {
    snapshots[lift.name] = lift.trainingMax;
  }
  return snapshots;
}

export function createProgram(
  mainLifts: MainLift[],
  settings: Settings,
): {
  program: Omit<Program, 'id'>;
  firstCycle: Omit<Cycle, 'id'>;
  workoutDays: Omit<WorkoutDay, 'id'>[];
  workoutSets: Omit<WorkoutSet, 'id'>[];
} {
  const totalCycles = settings.leaderCycles + settings.anchorCycles;
  const now = new Date().toISOString();
  const { cycleType, supplementType } = getSupplementForCycle(0, settings.leaderCycles, settings.defaultSupplement);
  const tmSnapshots = buildTMSnapshots(mainLifts);

  const program: Omit<Program, 'id'> = {
    status: 'active',
    leaderCycles: settings.leaderCycles,
    anchorCycles: settings.anchorCycles,
    currentCycleIndex: 0,
    totalCycles,
    createdAt: now,
  };

  const firstCycle: Omit<Cycle, 'id'> = {
    programId: -1,
    cycleIndex: 0,
    cycleType,
    supplementType,
    status: 'active',
    startedAt: now,
    tmSnapshots,
  };

  const { workoutDays, workoutSets } = generateCycleWorkouts(
    -1, -1, tmSnapshots, supplementType, settings.roundingIncrement,
  );

  return { program, firstCycle, workoutDays, workoutSets };
}

export type AdvanceCycleResult =
  | { needsSeventhWeek: true; updatedLifts: MainLift[] }
  | {
      needsSeventhWeek: false;
      updatedLifts: MainLift[];
      nextCycle: Omit<Cycle, 'id'>;
      workoutDays: Omit<WorkoutDay, 'id'>[];
      workoutSets: Omit<WorkoutSet, 'id'>[];
    };

export function advanceCycle(
  program: Program,
  currentCycle: Cycle,
  mainLifts: MainLift[],
  settings: Settings,
): AdvanceCycleResult {
  const nextIndex = currentCycle.cycleIndex + 1;
  const isLastCycle = nextIndex >= program.totalCycles;

  const updatedLifts = mainLifts.map((lift) => ({
    ...lift,
    trainingMax: applyTMIncrease(lift.trainingMax, lift.name, settings.unit),
    updatedAt: new Date().toISOString(),
  }));

  if (isLastCycle) {
    return { needsSeventhWeek: true, updatedLifts };
  }

  const { cycleType, supplementType } = getSupplementForCycle(
    nextIndex, program.leaderCycles, settings.defaultSupplement,
  );
  const tmSnapshots = buildTMSnapshots(updatedLifts);

  const nextCycle: Omit<Cycle, 'id'> = {
    programId: program.id!,
    cycleIndex: nextIndex,
    cycleType,
    supplementType,
    status: 'active',
    startedAt: new Date().toISOString(),
    tmSnapshots,
  };

  const { workoutDays, workoutSets } = generateCycleWorkouts(
    -1, program.id!, tmSnapshots, supplementType, settings.roundingIncrement,
  );

  return {
    needsSeventhWeek: false,
    updatedLifts,
    nextCycle,
    workoutDays,
    workoutSets,
  };
}

export function shouldOfferSeventhWeek(program: Program, cycleIndex: number): boolean {
  return cycleIndex >= program.totalCycles - 1;
}

export function getDefaultSupplementForCycle(
  cycleIndex: number,
  leaderCycles: number,
  defaultSupplement: SupplementType,
): SupplementType {
  return getSupplementForCycle(cycleIndex, leaderCycles, defaultSupplement).supplementType;
}

export { LIFT_NAMES };
