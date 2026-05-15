import { describe, it, expect } from 'vitest';
import { createProgram, advanceCycle, shouldOfferSeventhWeek, getDefaultSupplementForCycle } from '../program-engine';
import type { MainLift, Settings } from '../types';

const mockLifts: MainLift[] = [
  { id: 1, name: 'squat', oneRepMax: 140, trainingMax: 120, unit: 'kg', updatedAt: '' },
  { id: 2, name: 'bench', oneRepMax: 95, trainingMax: 80, unit: 'kg', updatedAt: '' },
  { id: 3, name: 'deadlift', oneRepMax: 165, trainingMax: 140, unit: 'kg', updatedAt: '' },
  { id: 4, name: 'ohp', oneRepMax: 70, trainingMax: 60, unit: 'kg', updatedAt: '' },
];

const mockSettings: Settings = {
  id: 1,
  unit: 'kg',
  tmPercentage: 85,
  roundingIncrement: 2.5,
  leaderCycles: 2,
  anchorCycles: 1,
  defaultSupplement: 'bbb',
  skipDeload: false,
  createdAt: '',
  updatedAt: '',
};

describe('createProgram', () => {
  it('creates a program with correct cycle count', () => {
    const { program } = createProgram(mockLifts, mockSettings);
    expect(program.totalCycles).toBe(3); // 2 leader + 1 anchor
    expect(program.currentCycleIndex).toBe(0);
    expect(program.status).toBe('active');
  });

  it('first cycle is leader type with BBB', () => {
    const { firstCycle } = createProgram(mockLifts, mockSettings);
    expect(firstCycle.cycleType).toBe('leader');
    expect(firstCycle.supplementType).toBe('bbb');
    expect(firstCycle.cycleIndex).toBe(0);
  });

  it('snapshots TMs correctly', () => {
    const { firstCycle } = createProgram(mockLifts, mockSettings);
    expect(firstCycle.tmSnapshots.squat).toBe(120);
    expect(firstCycle.tmSnapshots.bench).toBe(80);
    expect(firstCycle.tmSnapshots.deadlift).toBe(140);
    expect(firstCycle.tmSnapshots.ohp).toBe(60);
  });

  it('generates 16 workout days for first cycle', () => {
    const { workoutDays } = createProgram(mockLifts, mockSettings);
    expect(workoutDays).toHaveLength(16);
  });
});

describe('advanceCycle', () => {
  it('returns next leader cycle as second cycle', () => {
    const { program, firstCycle } = createProgram(mockLifts, mockSettings);
    const prog = { ...program, id: 1 };
    const cycle = { ...firstCycle, id: 1, programId: 1 };

    const result = advanceCycle(prog, cycle, mockLifts, mockSettings);
    expect(result.needsSeventhWeek).toBe(false);
    if (!result.needsSeventhWeek) {
      expect(result.nextCycle.cycleIndex).toBe(1);
      expect(result.nextCycle.cycleType).toBe('leader');
      expect(result.nextCycle.supplementType).toBe('bbb');
    }
  });

  it('increases TMs for updated lifts', () => {
    const { program, firstCycle } = createProgram(mockLifts, mockSettings);
    const prog = { ...program, id: 1 };
    const cycle = { ...firstCycle, id: 1, programId: 1 };

    const result = advanceCycle(prog, cycle, mockLifts, mockSettings);
    const squat = result!.updatedLifts.find(l => l.name === 'squat')!;
    const bench = result!.updatedLifts.find(l => l.name === 'bench')!;
    expect(squat.trainingMax).toBe(125);  // +5kg
    expect(bench.trainingMax).toBe(82.5); // +2.5kg
  });

  it('signals seventh week on last cycle', () => {
    const { program, firstCycle } = createProgram(mockLifts, mockSettings);
    const prog = { ...program, id: 1 };
    const lastCycle = { ...firstCycle, id: 3, programId: 1, cycleIndex: 2, cycleType: 'anchor' as const };

    const result = advanceCycle(prog, lastCycle, mockLifts, mockSettings);
    expect(result!.needsSeventhWeek).toBe(true);
  });
});

describe('shouldOfferSeventhWeek', () => {
  it('returns true for last cycle', () => {
    const program = { id: 1, totalCycles: 3, status: 'active' as const, leaderCycles: 2, anchorCycles: 1, currentCycleIndex: 2, createdAt: '' };
    expect(shouldOfferSeventhWeek(program, 2)).toBe(true);
  });

  it('returns false for non-last cycle', () => {
    const program = { id: 1, totalCycles: 3, status: 'active' as const, leaderCycles: 2, anchorCycles: 1, currentCycleIndex: 0, createdAt: '' };
    expect(shouldOfferSeventhWeek(program, 0)).toBe(false);
  });
});

describe('getDefaultSupplementForCycle', () => {
  it('returns BBB for leader cycles when default is BBB', () => {
    expect(getDefaultSupplementForCycle(0, 2, 'bbb')).toBe('bbb');
    expect(getDefaultSupplementForCycle(1, 2, 'bbb')).toBe('bbb');
  });

  it('returns FSL for anchor cycles when default is BBB', () => {
    expect(getDefaultSupplementForCycle(2, 2, 'bbb')).toBe('fsl');
  });

  it('returns FSL for all when default is FSL', () => {
    expect(getDefaultSupplementForCycle(0, 2, 'fsl')).toBe('fsl');
    expect(getDefaultSupplementForCycle(2, 2, 'fsl')).toBe('fsl');
  });
});
