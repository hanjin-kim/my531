import { create } from 'zustand';

interface WorkoutStore {
  activeWorkoutId: number | null;
  currentSetIndex: number;
  restTimerEnd: number | null;
  setActiveWorkout: (id: number | null) => void;
  setCurrentSetIndex: (index: number) => void;
  startRestTimer: (seconds: number) => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeWorkoutId: null,
  currentSetIndex: 0,
  restTimerEnd: null,
  setActiveWorkout: (id) => set({ activeWorkoutId: id, currentSetIndex: 0, restTimerEnd: null }),
  setCurrentSetIndex: (index) => set({ currentSetIndex: index }),
  startRestTimer: (seconds) => set({ restTimerEnd: Date.now() + seconds * 1000 }),
  clearRestTimer: () => set({ restTimerEnd: null }),
}));
