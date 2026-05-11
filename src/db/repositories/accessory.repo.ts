import type { AccessoryExercise, AccessoryPreset, AccessorySetRecord } from '../../core/types';
import { db } from '../schema';

export async function getAccessoriesByWorkout(workoutDayId: number): Promise<AccessoryExercise[]> {
  return db.accessoryExercises.where('workoutDayId').equals(workoutDayId).toArray();
}

export async function addAccessory(accessory: Omit<AccessoryExercise, 'id'>): Promise<number> {
  return (await db.accessoryExercises.add(accessory as AccessoryExercise)) as number;
}

export async function updateAccessory(id: number, updates: Partial<AccessoryExercise>): Promise<void> {
  await db.accessoryExercises.update(id, updates);
}

export async function deleteAccessory(id: number): Promise<void> {
  await db.accessoryExercises.delete(id);
}

export async function completeAccessorySet(
  id: number,
  setIndex: number,
  weight: number,
  reps: number,
): Promise<void> {
  const exercise = await db.accessoryExercises.get(id);
  if (!exercise) return;

  const records = [...exercise.setRecords];
  records[setIndex] = { weight, reps, completed: true };
  const completedSets = records.filter(r => r.completed).length;

  await db.accessoryExercises.update(id, { setRecords: records, completedSets });
}

export async function undoAccessorySet(id: number, setIndex: number): Promise<void> {
  const exercise = await db.accessoryExercises.get(id);
  if (!exercise) return;

  const records = [...exercise.setRecords];
  const current = records[setIndex];
  if (!current) return;
  records[setIndex] = { weight: current.weight, reps: current.reps, completed: false };
  const completedSets = records.filter(r => r.completed).length;

  await db.accessoryExercises.update(id, { setRecords: records, completedSets });
}

export function buildSetRecords(sets: number, reps: number, weight: number): AccessorySetRecord[] {
  return Array.from({ length: sets }, () => ({ weight, reps, completed: false }));
}

// Preset operations

export async function getAllPresets(): Promise<AccessoryPreset[]> {
  return db.accessoryPresets.toArray();
}

export async function getPresetsByCategory(category: AccessoryPreset['category']): Promise<AccessoryPreset[]> {
  return db.accessoryPresets.where('category').equals(category).toArray();
}

export async function addPreset(preset: Omit<AccessoryPreset, 'id'>): Promise<number> {
  return (await db.accessoryPresets.add(preset as AccessoryPreset)) as number;
}

export async function deletePreset(id: number): Promise<void> {
  await db.accessoryPresets.delete(id);
}
