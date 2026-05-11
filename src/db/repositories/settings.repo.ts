import type { Settings } from '../../core/types';
import { db } from '../schema';

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get(1);
  if (!settings) throw new Error('Settings not initialized');
  return settings;
}

export async function updateSettings(updates: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<void> {
  await db.settings.update(1, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
