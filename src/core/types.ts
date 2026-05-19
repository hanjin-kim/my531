export type LiftName = 'squat' | 'bench' | 'deadlift' | 'ohp';
export type Unit = 'kg' | 'lbs';
export type CycleType = 'leader' | 'anchor';
export type WeekNumber = 1 | 2 | 3 | 4;
export type SetType = 'warmup' | 'main' | 'amrap' | 'supplement' | 'accessory';
export type SupplementType = 'bbb' | 'fsl' | 'none';
export type SeventhWeekChoice = 'tm_test' | 'deload';
export type ProgramStatus = 'active' | 'completed' | 'abandoned';
export type WorkoutStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type TMTestResult = 'pass' | 'marginal' | 'fail';

export interface Settings {
  id: 1;
  unit: Unit;
  tmPercentage: number;
  roundingIncrement: number;
  leaderCycles: number;
  anchorCycles: number;
  defaultSupplement: SupplementType;
  skipDeload: boolean;
  tmIncreaseUpper: number;
  tmIncreaseLower: number;
  createdAt: string;
  updatedAt: string;
}

export interface MainLift {
  id?: number;
  name: LiftName;
  oneRepMax: number;
  trainingMax: number;
  unit: Unit;
  updatedAt: string;
}

export interface Program {
  id?: number;
  status: ProgramStatus;
  leaderCycles: number;
  anchorCycles: number;
  currentCycleIndex: number;
  totalCycles: number;
  createdAt: string;
  completedAt?: string;
}

export interface Cycle {
  id?: number;
  programId: number;
  cycleIndex: number;
  cycleType: CycleType;
  supplementType: SupplementType;
  status: ProgramStatus;
  startedAt?: string;
  completedAt?: string;
  tmSnapshots: Record<LiftName, number>;
}

export interface WorkoutDay {
  id?: number;
  cycleId: number;
  programId: number;
  week: WeekNumber;
  dayIndex: number;
  liftName: LiftName;
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkoutSet {
  id?: number;
  workoutDayId: number;
  setIndex: number;
  setType: SetType;
  targetWeight: number;
  targetReps: number;
  actualReps?: number;
  isCompleted: boolean;
  isAmrap: boolean;
  percentage?: number;
  completedAt?: string;
}

export interface AccessorySetRecord {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface AccessoryExercise {
  id?: number;
  workoutDayId: number;
  name: string;
  targetSets: number;
  targetReps: number;
  weight?: number;
  completedSets: number;
  setRecords: AccessorySetRecord[];
  notes?: string;
}

export interface AccessoryPreset {
  id?: number;
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight?: number;
  category: 'push' | 'pull' | 'legs' | 'core' | 'other';
}

export interface SeventhWeekProtocol {
  id?: number;
  programId: number;
  afterCycleId: number;
  choice: SeventhWeekChoice;
  tmTestResults?: Record<LiftName, {
    weight: number;
    reps: number;
    passed: boolean;
  }>;
  completedAt?: string;
}

export interface AMRAPRecord {
  id?: number;
  programId: number;
  cycleId: number;
  liftName: LiftName;
  week: WeekNumber;
  weight: number;
  targetReps: number;
  actualReps: number;
  e1rm: number;
  date: string;
}

export interface MainSetPrescription {
  percentage: number;
  weight: number;
  targetReps: number;
  isAmrap: boolean;
}

export interface SupplementSetPrescription {
  weight: number;
  targetReps: number;
  sets: number;
}
