import { create } from 'zustand';

interface NavigationStore {
  bottomSheetOpen: boolean;
  bottomSheetContent: string | null;
  openBottomSheet: (content: string) => void;
  closeBottomSheet: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  bottomSheetOpen: false,
  bottomSheetContent: null,
  openBottomSheet: (content) => set({ bottomSheetOpen: true, bottomSheetContent: content }),
  closeBottomSheet: () => set({ bottomSheetOpen: false, bottomSheetContent: null }),
}));
