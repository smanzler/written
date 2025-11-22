import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SyncStoreState = {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  pendingCount: number;
  conflicts: Array<{ localId: number; remoteId: string }>;

  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setSyncError: (error: string | null) => void;
  setPendingCount: (count: number) => void;
  addConflict: (conflict: { localId: number; remoteId: string }) => void;
  clearConflicts: () => void;
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
      setPendingCount: (count) => set({ pendingCount: count }),
      addConflict: (conflict) =>
        set((state) => ({
          conflicts: [...state.conflicts, conflict],
        })),
      clearConflicts: () => set({ conflicts: [] }),
    }),
    {
      name: "written-sync-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt?.toISOString() ?? null,
        conflicts: state.conflicts,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          lastSyncAt?: string | null;
          conflicts?: Array<{ localId: number; remoteId: string }>;
        };
        return {
          ...currentState,
          lastSyncAt: persisted.lastSyncAt
            ? new Date(persisted.lastSyncAt)
            : null,
          conflicts: persisted.conflicts ?? [],
        };
      },
    }
  )
);
