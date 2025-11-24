import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SyncStoreState = {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;

  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setSyncError: (error: string | null) => void;
};

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastSyncAt: null,
      syncError: null,
      pendingCount: 0,
      conflicts: [],

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncAt: (date) => set({ lastSyncAt: date }),
      setSyncError: (error) => set({ syncError: error }),
    }),
    {
      name: "written-sync-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt?.toISOString() ?? null,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          lastSyncAt?: string | null;
        };
        return {
          ...currentState,
          lastSyncAt: persisted.lastSyncAt
            ? new Date(persisted.lastSyncAt)
            : null,
        };
      },
    }
  )
);
