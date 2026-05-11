import { create } from 'zustand';
import type { Settings } from '../core/types';
import { getSettings, updateSettings as updateSettingsRepo } from '../db/repositories/settings.repo';

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (updates: Partial<Omit<Settings, 'id' | 'createdAt'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: true,
  load: async () => {
    try {
      const settings = await getSettings();
      set({ settings, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  update: async (updates) => {
    await updateSettingsRepo(updates);
    const current = get().settings;
    if (current) {
      set({ settings: { ...current, ...updates, updatedAt: new Date().toISOString() } });
    }
  },
}));
