import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { updateSettings } from '../db/repositories/settings.repo';
import type { Settings } from '../core/types';

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get(1));

  const update = async (updates: Partial<Omit<Settings, 'id' | 'createdAt'>>) => {
    await updateSettings(updates);
  };

  return { settings: settings ?? null, loading: settings === undefined, update };
}
