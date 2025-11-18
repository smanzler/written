// TODO: Uncomment when implementing
// import { supabase } from "./supabase";
// import { db, type Journal, type Settings } from "./db";
import { useSyncStore } from "@/stores/syncStore";
// import { useAuthStore } from "@/stores/authStore"; // TODO: Uncomment when implementing sync
import type { Journal } from "./db";
// import type { Settings } from "./db"; // TODO: Uncomment when implementing settings sync

/**
 * Sync Engine for syncing journals between local Dexie and Supabase
 *
 * Architecture:
 * - Pull: Fetch from Supabase → Store in Dexie
 * - Push: Send from Dexie → Upload to Supabase
 * - Conflict Resolution: Last-write-wins with version tracking
 */

// Module-level state for sync intervals and handlers
let syncInterval: number | null = null;
let visibilityHandler: (() => void) | null = null;
let networkHandler: (() => void) | null = null;

/**
 * Main sync method - orchestrates pull and push
 * TODO: Check if user is authenticated before syncing
 * TODO: Handle network errors gracefully
 * TODO: Implement retry logic with exponential backoff
 */
export async function sync(): Promise<void> {
  // TODO: Check auth before syncing
  // const { user } = useAuthStore.getState();
  // if (!user) {
  //   return; // Don't sync if not authenticated
  // }

  const syncStore = useSyncStore.getState();
  syncStore.setSyncing(true);
  syncStore.setSyncError(null);

  try {
    // Pull remote changes first
    await pull();
    await pullSettings();

    // Then push local changes
    await push();
    await pushSettings();

    // Update sync timestamp
    syncStore.setLastSyncAt(new Date());

    // TODO: Update pending count based on journals with sync_status !== 'synced'
    // const pending = await db.journals
    //   .where("sync_status")
    //   .notEqual("synced")
    //   .count();
    // syncStore.setPendingCount(pending);
  } catch (error) {
    console.error("Sync failed:", error);
    syncStore.setSyncError(
      error instanceof Error ? error.message : "Unknown sync error"
    );
    throw error;
  } finally {
    syncStore.setSyncing(false);
  }
}

/**
 * Pull journals from Supabase and merge into Dexie
 * TODO: Implement incremental sync using lastSyncAt timestamp
 * TODO: Handle pagination if there are many journals
 * TODO: Transform Supabase response to Journal format
 * TODO: Upsert journals into Dexie (handle conflicts)
 * TODO: Map server_id to local journals
 */
export async function pull(): Promise<void> {
  // TODO: Get user ID from auth store
  // const { user } = useAuthStore.getState();
  // if (!user) return;
  // TODO: Query Supabase for journals
  // const { data, error } = await supabase
  //   .from("journals")
  //   .select("*")
  //   .eq("user_id", user.id)
  //   .order("updated_at", { ascending: false });
  // if (error) throw error;
  // TODO: For each remote journal:
  // 1. Check if local journal exists (by server_id)
  // 2. If exists, check for conflicts
  // 3. If conflict, resolve using last-write-wins
  // 4. Upsert into Dexie
  // Example structure:
  // for (const remoteJournal of data) {
  //   const localJournal = await db.journals
  //     .where("server_id")
  //     .equals(remoteJournal.id)
  //     .first();
  //
  //   if (localJournal) {
  //     // Check for conflicts
  //     if (hasConflict(localJournal, remoteJournal)) {
  //       const resolved = await resolveConflict(localJournal, remoteJournal);
  //       await db.journals.update(localJournal.id, resolved);
  //     } else {
  //       // No conflict, update local with remote
  //       await db.journals.update(localJournal.id, transformRemote(remoteJournal));
  //     }
  //   } else {
  //     // New journal, insert
  //     await db.journals.add(transformRemote(remoteJournal));
  //   }
  // }
}

/**
 * Push local journals to Supabase
 * TODO: Get journals with sync_status === 'pending' or null
 * TODO: Batch upload (e.g., 10-20 at a time)
 * TODO: Handle journals without server_id (new journals)
 * TODO: Handle journals with server_id (updates)
 * TODO: Update sync_status to 'synced' after successful upload
 * TODO: Store server_id in local journal after first push
 */
export async function push(): Promise<void> {
  // TODO: Get user ID from auth store
  // const { user } = useAuthStore.getState();
  // if (!user) return;
  // TODO: Get pending journals
  // const pendingJournals = await db.journals
  //   .where("sync_status")
  //   .anyOf(["pending", null])
  //   .toArray();
  // TODO: Batch process (e.g., 20 at a time)
  // for (let i = 0; i < pendingJournals.length; i += 20) {
  //   const batch = pendingJournals.slice(i, i + 20);
  //
  //   for (const journal of batch) {
  //     try {
  //       if (journal.server_id) {
  //         // Update existing journal on server
  //         const { data, error } = await supabase
  //           .from("journals")
  //           .update(transformLocal(journal))
  //           .eq("id", journal.server_id)
  //           .eq("user_id", user.id);
  //
  //         if (error) throw error;
  //       } else {
  //         // Create new journal on server
  //         const { data, error } = await supabase
  //           .from("journals")
  //           .insert({
  //             ...transformLocal(journal),
  //             user_id: user.id,
  //           })
  //           .select()
  //           .single();
  //
  //         if (error) throw error;
  //
  //         // Store server_id locally
  //         await db.journals.update(journal.id, {
  //           server_id: data.id,
  //           sync_status: "synced",
  //           synced_at: new Date(),
  //         });
  //       }
  //     } catch (error) {
  //       // Mark as error, will retry on next sync
  //       await db.journals.update(journal.id, {
  //         sync_status: "error",
  //       });
  //       throw error;
  //     }
  //   }
  // }
}

/**
 * Check if there's a conflict between local and remote journal
 * TODO: Compare updated_at timestamps
 * TODO: Consider version numbers if implemented
 * TODO: Return true if both have been modified since last sync
 */
export function hasConflict(_local: Journal, _remote: any): boolean {
  // TODO: Implement conflict detection
  // const localTime = new Date(local.updated_at).getTime();
  // const remoteTime = new Date(remote.updated_at).getTime();
  // const lastSync = local.synced_at ? new Date(local.synced_at).getTime() : 0;
  //
  // // Conflict if both were modified after last sync
  // return localTime > lastSync && remoteTime > lastSync;
  return false;
}

/**
 * Resolve conflict between local and remote journal
 * TODO: Implement last-write-wins strategy
 * TODO: Optionally log conflicts for user review
 * TODO: Return resolved journal
 */
export async function resolveConflict(
  _local: Journal,
  _remote: any
): Promise<Partial<Journal>> {
  // TODO: Implement conflict resolution
  // const localTime = new Date(local.updated_at).getTime();
  // const remoteTime = new Date(remote.updated_at).getTime();
  //
  // if (remoteTime > localTime) {
  //   // Remote is newer - accept it
  //   const syncStore = useSyncStore.getState();
  //   syncStore.addConflict({ localId: local.id!, remoteId: remote.id });
  //   return transformRemote(remote);
  // } else {
  //   // Local is newer - keep local, will push on next sync
  //   return local;
  // }
  return {};
}

/**
 * Transform Supabase journal to local Journal format
 * TODO: Map Supabase fields to Dexie Journal fields
 * TODO: Handle date conversions
 * TODO: Preserve encryption state
 */
export function transformRemote(_remote: any): Partial<Journal> {
  // TODO: Implement transformation
  // return {
  //   server_id: remote.id,
  //   user_id: remote.user_id,
  //   raw_blob: remote.raw_blob,
  //   encrypted_blob: remote.encrypted_blob,
  //   is_encrypted: remote.is_encrypted,
  //   created_at: new Date(remote.created_at),
  //   updated_at: new Date(remote.updated_at),
  //   synced_at: new Date(),
  //   sync_status: "synced",
  // };
  return {};
}

/**
 * Transform local Journal to Supabase format
 * TODO: Map Dexie Journal fields to Supabase fields
 * TODO: Exclude local-only fields (id, sync_status, etc.)
 * TODO: Handle date serialization
 */
export function transformLocal(_local: Journal): any {
  // TODO: Implement transformation
  // return {
  //   raw_blob: local.raw_blob,
  //   encrypted_blob: local.encrypted_blob,
  //   is_encrypted: local.is_encrypted,
  //   created_at: local.created_at.toISOString(),
  //   updated_at: local.updated_at.toISOString(),
  // };
  return {};
}

/**
 * Pull settings from Supabase and merge into Dexie
 * TODO: Get user settings from Supabase
 * TODO: Handle case where no settings exist on server
 * TODO: Merge with local settings (last-write-wins based on updated_at)
 * TODO: Update local settings if remote is newer
 */
export async function pullSettings(): Promise<void> {
  // TODO: Get user ID from auth store
  // const { user } = useAuthStore.getState();
  // if (!user) return;
  // TODO: Query Supabase for user settings
  // const { data, error } = await supabase
  //   .from("settings")
  //   .select("*")
  //   .eq("user_id", user.id)
  //   .single();
  // if (error && error.code !== "PGRST116") {
  //   // PGRST116 = no rows returned, which is fine for first-time users
  //   throw error;
  // }
  // if (!data) return; // No settings on server yet
  // TODO: Get local settings
  // const localSettings = await db.settings.get(1);
  // TODO: Compare timestamps and merge
  // if (localSettings) {
  //   const localTime = localSettings.updated_at
  //     ? new Date(localSettings.updated_at).getTime()
  //     : 0;
  //   const remoteTime = new Date(data.updated_at).getTime();
  //
  //   if (remoteTime > localTime) {
  //     // Remote is newer, update local
  //     await db.settings.update(1, {
  //       ...data,
  //       id: 1, // Keep local id
  //     });
  //   }
  //   // If local is newer, keep it (will push on next sync)
  // } else {
  //   // No local settings, use remote
  //   await db.settings.add({
  //     ...data,
  //     id: 1,
  //   });
  // }
}

/**
 * Push local settings to Supabase
 * TODO: Get local settings from Dexie
 * TODO: Upsert to Supabase (create if doesn't exist, update if exists)
 * TODO: Handle case where settings don't exist on server yet
 */
export async function pushSettings(): Promise<void> {
  // TODO: Get user ID from auth store
  // const { user } = useAuthStore.getState();
  // if (!user) return;
  // TODO: Get local settings
  // const localSettings = await db.settings.get(1);
  // if (!localSettings) return; // No settings to sync
  // TODO: Check if settings exist on server
  // const { data: existing } = await supabase
  //   .from("settings")
  //   .select("id")
  //   .eq("user_id", user.id)
  //   .single();
  // const settingsToSync = {
  //   lockEnabled: localSettings.lockEnabled,
  //   cursorColor: localSettings.cursorColor,
  //   textColor: localSettings.textColor,
  //   cleanupEnabled: localSettings.cleanupEnabled,
  //   cleanupPrompt: localSettings.cleanupPrompt,
  //   selectedModel: localSettings.selectedModel,
  //   updated_at: new Date().toISOString(),
  // };
  // if (existing) {
  //   // Update existing settings
  //   const { error } = await supabase
  //     .from("settings")
  //     .update(settingsToSync)
  //     .eq("id", existing.id)
  //     .eq("user_id", user.id);
  //
  //   if (error) throw error;
  // } else {
  //   // Create new settings
  //   const { error } = await supabase
  //     .from("settings")
  //     .insert({
  //       ...settingsToSync,
  //       user_id: user.id,
  //     });
  //
  //   if (error) throw error;
  // }
}

/**
 * Start periodic sync
 * TODO: Sync every 30-60 seconds when active
 * TODO: Sync every 5 minutes when idle
 * TODO: Make interval configurable
 */
export function startPeriodicSync(intervalMs: number = 30000): void {
  if (syncInterval) {
    stopPeriodicSync();
  }

  syncInterval = window.setInterval(() => {
    sync().catch((error) => {
      console.error("Periodic sync failed:", error);
    });
  }, intervalMs);
}

/**
 * Stop periodic sync
 */
export function stopPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Setup sync on visibility change (when tab becomes visible)
 * TODO: Sync when user returns to tab
 */
export function setupVisibilitySync(): void {
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
  }

  visibilityHandler = () => {
    if (!document.hidden) {
      sync().catch((error) => {
        console.error("Visibility sync failed:", error);
      });
    }
  };

  document.addEventListener("visibilitychange", visibilityHandler);
}

/**
 * Setup sync on network reconnect
 * TODO: Listen for online event
 * TODO: Sync when network comes back
 */
export function setupNetworkSync(): void {
  if (networkHandler) {
    window.removeEventListener("online", networkHandler);
  }

  networkHandler = () => {
    sync().catch((error) => {
      console.error("Network sync failed:", error);
    });
  };

  window.addEventListener("online", networkHandler);
}

/**
 * Cleanup all sync listeners and intervals
 */
export function cleanup(): void {
  stopPeriodicSync();

  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }

  if (networkHandler) {
    window.removeEventListener("online", networkHandler);
    networkHandler = null;
  }
}
