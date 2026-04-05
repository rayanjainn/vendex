import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  isCompareDrawerOpen: boolean;
  setCompareDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  viewMode: 'card',
  setViewMode: (viewMode) => set({ viewMode }),
  
  compareIds: [],
  toggleCompare: (id) => set((state) => {
    if (state.compareIds.includes(id)) {
      return { compareIds: state.compareIds.filter(cid => cid !== id) };
    }
    if (state.compareIds.length >= 4) return state; // Max 4
    return { compareIds: [...state.compareIds, id] };
  }),
  clearCompare: () => set({ compareIds: [], isCompareDrawerOpen: false }),
  isCompareDrawerOpen: false,
  setCompareDrawerOpen: (isCompareDrawerOpen) => set({ isCompareDrawerOpen })
}));
