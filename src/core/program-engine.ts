import type {
  Cycle, CycleType, LiftName, MainLift, Program, Settings,
  WorkoutDay, WorkoutSet,
} from './types';
import { LIFT_NAMES } from './constants';
import { generateCycleWorkouts, type LiftCycleConfig } from './cycle-generator';
import { applyTMIncrease, reduceTM, type TMDecision } from './progression';

// Leader/anchor is a label only; the main-set style and supplement are chosen per lift.
function getCycleType(cycleIndex: number, leaderCycles: number): CycleType {
  return cycleIndex < leaderCycles ? 'leader' : 'anchor';
}

function buildTMSnapshots(mainLifts: MainLift[]): Record<LiftName, number> {
  const snapshots = {} as Record<LiftName, number>;
  for (const lift of mainLifts) {
    snapshots[lift.name] = lift.trainingMax;
  }
  return snapshots;
}

function buildLiftConfigs(mainLifts: MainLift[]): Record<LiftName, LiftCycleConfig> {
  const configs = {} as Record<LiftName, LiftCycleConfig>;
  for (const lift of mainLifts) {
    configs[lift.name] = { fivesPro: lift.mainSetStyle === '5spro', supplementType: lift.supplementType };
  }
  return configs;
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
  const cycleType = getCycleType(0, settings.leaderCycles);
  const tmSnapshots = buildTMSnapshots(mainLifts);
  const liftConfigs = buildLiftConfigs(mainLifts);

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
    status: 'active',
    startedAt: now,
    tmSnapshots,
  };

  const { workoutDays, workoutSets } = generateCycleWorkouts(
    -1, -1, tmSnapshots, liftConfigs, settings.roundingIncrement,
    {
      skipDeload: settings.skipDeload,
      bbbSets: settings.bbbSets,
      fslSets: settings.fslSets,
    },
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
  tmDecisions?: Partial<Record<LiftName, TMDecision>>,
): AdvanceCycleResult {
  const nextIndex = currentCycle.cycleIndex + 1;
  const isLastCycle = nextIndex >= program.totalCycles;

  const updatedLifts = mainLifts.map((lift) => {
    const decision = tmDecisions?.[lift.name] ?? 'increase';
    let trainingMax: number;
    if (decision === 'reduce') {
      trainingMax = Math.round(reduceTM(lift.trainingMax) * 100) / 100;
    } else if (decision === 'keep') {
      trainingMax = lift.trainingMax;
    } else {
      trainingMax = applyTMIncrease(lift.trainingMax, lift.name, settings.unit, settings.tmIncrease);
    }
    return { ...lift, trainingMax, updatedAt: new Date().toISOString() };
  });

  if (isLastCycle) {
    return { needsSeventhWeek: true, updatedLifts };
  }

  const cycleType = getCycleType(nextIndex, program.leaderCycles);
  const tmSnapshots = buildTMSnapshots(updatedLifts);
  const liftConfigs = buildLiftConfigs(updatedLifts);

  const nextCycle: Omit<Cycle, 'id'> = {
    programId: program.id!,
    cycleIndex: nextIndex,
    cycleType,
    status: 'active',
    startedAt: new Date().toISOString(),
    tmSnapshots,
  };

  const { workoutDays, workoutSets } = generateCycleWorkouts(
    -1, program.id!, tmSnapshots, liftConfigs, settings.roundingIncrement,
    {
      skipDeload: settings.skipDeload,
      bbbSets: settings.bbbSets,
      fslSets: settings.fslSets,
    },
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

export { LIFT_NAMES };
