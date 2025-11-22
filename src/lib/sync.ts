import { useSyncStore } from "@/stores/syncStore";
import { db, type Journal } from "./db";
import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/authStore";

export async function sync(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) {
    return;
  }

  const syncStore = useSyncStore.getState();
  syncStore.setSyncing(true);
  syncStore.setSyncError(null);

  try {
    await pull();
    await pullSettings();

    await push();
    await pushSettings();

    syncStore.setLastSyncAt(new Date());

    const pending = await db.journals
      .where("sync_status")
      .notEqual("synced")
      .count();

    syncStore.setPendingCount(pending);
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

export async function pull(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) return;

  const lastSync = useSyncStore.getState().lastSyncAt ?? new Date(0);

  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .gte("updated_at", lastSync.toISOString())
    .order("updated_at", { ascending: false });

  if (error) throw error;

  for (const remoteJournal of data) {
    const localJournal = await db.journals
      .where("server_id")
      .equals(remoteJournal.id)
      .first();

    const transformedRemoteJournal = transformRemote(remoteJournal);

    if (localJournal) {
      if (hasConflict(localJournal, transformedRemoteJournal)) {
        const resolved = await resolveConflict(
          localJournal,
          transformedRemoteJournal
        );
        await db.journals.update(localJournal.id, resolved);
      } else {
        await db.journals.update(localJournal.id, transformedRemoteJournal);
      }
    } else {
      await db.journals.add(transformedRemoteJournal);
    }
  }
}

export async function push(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) return;
  const pendingJournals = await db.journals
    .filter((journal) => journal.sync_status !== "synced")
    .toArray();

  for (let i = 0; i < pendingJournals.length; i += 20) {
    const batch = pendingJournals.slice(i, i + 20);

    for (const journal of batch) {
      try {
        if (journal.server_id) {
          const { error } = await supabase
            .from("journals")
            .update(transformLocal(journal))
            .eq("id", journal.server_id)
            .eq("user_id", user.id);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("journals")
            .insert({
              ...transformLocal(journal),
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          await db.journals.update(journal.id, {
            server_id: data.id,
            sync_status: "synced",
            synced_at: new Date(),
          });
        }
      } catch (error) {
        await db.journals.update(journal.id, {
          sync_status: "error",
        });
        throw error;
      }
    }
  }
}

export function hasConflict(local: Journal, remote: any): boolean {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();
  const lastSync = local.synced_at ? new Date(local.synced_at).getTime() : 0;

  return localTime > lastSync && remoteTime > lastSync;
}

export async function resolveConflict(
  local: Journal,
  remote: Omit<Journal, "id">
): Promise<Partial<Journal>> {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();

  if (remoteTime > localTime) {
    const syncStore = useSyncStore.getState();
    syncStore.addConflict({ localId: local.id!, remoteId: remote.server_id! });
    return transformRemote(remote);
  } else {
    return local;
  }
}

export function transformRemote(remote: any): Omit<Journal, "id"> {
  return {
    server_id: remote.id,
    user_id: remote.user_id || null,
    raw_blob: remote.raw_blob,
    encrypted_blob: remote.encrypted_blob,
    is_encrypted: remote.is_encrypted,
    created_at: new Date(remote.created_at),
    updated_at: new Date(remote.updated_at),
    synced_at: new Date(),
    sync_status: "synced",
  };
}

export function transformLocal(local: Journal): any {
  return {
    raw_blob: local.raw_blob,
    encrypted_blob: local.encrypted_blob,
    is_encrypted: local.is_encrypted,
    created_at: local.created_at.toISOString(),
    updated_at: local.updated_at.toISOString(),
  };
}

export async function pullSettings(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) return;
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  if (!data) return;
  const localSettings = await db.settings.get(1);
  if (localSettings) {
    const localTime = localSettings.updated_at?.getTime() ?? 0;
    const remoteTime = new Date(data.updated_at).getTime();

    if (remoteTime > localTime) {
      await db.settings.update(1, {
        ...data,
        id: 1,
      });
    }
  } else {
    await db.settings.add({
      ...data,
      id: 1,
    });
  }
}

export async function pushSettings(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) return;

  const localSettings = await db.settings.get(1);

  if (!localSettings) return;

  const settingsToSync = {
    lock_enabled: localSettings.lockEnabled,
    cursor_color: localSettings.cursorColor,
    text_color: localSettings.textColor,
    cleanup_enabled: localSettings.cleanupEnabled,
    cleanup_prompt: localSettings.cleanupPrompt,
    selected_model: localSettings.selectedModel,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("settings")
    .upsert(settingsToSync)
    .eq("user_id", user.id);

  if (error) throw error;

  await db.settings.update(1, {
    updated_at: new Date(),
  });
}

// export function startPeriodicSync(intervalMs: number = 30000): void {
//   if (syncInterval) {
//     stopPeriodicSync();
//   }

//   syncInterval = window.setInterval(() => {
//     sync().catch((error) => {
//       console.error("Periodic sync failed:", error);
//     });
//   }, intervalMs);
// }

// export function stopPeriodicSync(): void {
//   if (syncInterval) {
//     clearInterval(syncInterval);
//     syncInterval = null;
//   }
// }

// export function setupVisibilitySync(): void {
//   if (visibilityHandler) {
//     document.removeEventListener("visibilitychange", visibilityHandler);
//   }

//   visibilityHandler = () => {
//     if (!document.hidden) {
//       sync().catch((error) => {
//         console.error("Visibility sync failed:", error);
//       });
//     }
//   };

//   document.addEventListener("visibilitychange", visibilityHandler);
// }

// export function setupNetworkSync(): void {
//   if (networkHandler) {
//     window.removeEventListener("online", networkHandler);
//   }

//   networkHandler = () => {
//     sync().catch((error) => {
//       console.error("Network sync failed:", error);
//     });
//   };

//   window.addEventListener("online", networkHandler);
// }

// export function cleanup(): void {
//   stopPeriodicSync();

//   if (visibilityHandler) {
//     document.removeEventListener("visibilitychange", visibilityHandler);
//     visibilityHandler = null;
//   }

//   if (networkHandler) {
//     window.removeEventListener("online", networkHandler);
//     networkHandler = null;
//   }
// }
