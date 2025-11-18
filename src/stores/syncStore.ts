import { create } from "zustand";

type SyncStoreState = {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  pendingCount: number;
  conflicts: Array<{ localId: number; remoteId: string }>;

  // Actions
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setSyncError: (error: string | null) => void;
  setPendingCount: (count: number) => void;
  addConflict: (conflict: { localId: number; remoteId: string }) => void;
  clearConflicts: () => void;
};

export const useSyncStore = create<SyncStoreState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  pendingCount: 0,
  conflicts: [],

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
  setSyncError: (error) => set({ syncError: error }),
  setPendingCount: (count) => set({ pendingCount: count }),
  addConflict: (conflict) =>
    set((state) => ({
      conflicts: [...state.conflicts, conflict],
    })),
  clearConflicts: () => set({ conflicts: [] }),
}));
