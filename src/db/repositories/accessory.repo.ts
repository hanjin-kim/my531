import type { AccessoryExercise } from '../../core/types';
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
