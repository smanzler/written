import { useSyncStore } from "@/stores/syncStore";
import { db, type Journal } from "./db";
import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

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
      .filter((journal) => journal.sync_status !== "synced")
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
  const PAGE_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", user.id)
      .gte("updated_at", lastSync.toISOString())
      .order("updated_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

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

    offset += PAGE_SIZE;
    hasMore = data.length === PAGE_SIZE;
  }
}

export async function push(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) return;

  const pendingJournals = await db.journals
    .filter((journal) => journal.sync_status !== "synced")
    .toArray();

  const errors: Array<{ journalId: number; error: Error }> = [];

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

          await db.journals.update(journal.id, {
            sync_status: "synced",
            synced_at: new Date(),
          });
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
        errors.push({
          journalId: journal.id,
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Failed to sync ${errors.length} journal(s)`;
    console.error(errorMessage, errors);
    throw new Error(errorMessage);
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
    deleted_at: remote.deleted_at ? new Date(remote.deleted_at) : null,
  };
}

export function transformLocal(local: Journal): any {
  const result: any = {
    raw_blob: local.raw_blob,
    encrypted_blob: local.encrypted_blob,
    is_encrypted: local.is_encrypted,
    created_at: local.created_at.toISOString(),
    updated_at: local.updated_at.toISOString(),
  };

  if (local.deleted_at) {
    result.deleted_at = local.deleted_at.toISOString();
  }

  return result;
}

export async function pullSettings(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) return;

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return;

  const settingsStore = useSettingsStore.getState();
  const localSettings = settingsStore.settings;
  const localTime = localSettings.updated_at?.getTime() ?? 0;
  const remoteTime = new Date(data.updated_at).getTime();

  if (remoteTime > localTime) {
    settingsStore.saveSettings({
      lockEnabled: data.lock_enabled,
      cursorColor: data.cursor_color,
      textColor: data.text_color,
      cleanupEnabled: data.cleanup_enabled,
      cleanupPrompt: data.cleanup_prompt,
      selectedModel: data.selected_model,
      encryptedMaster: data.encrypted_master,
      keySalt: data.key_salt,
    });
  }
}

export async function pushSettings(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) return;

  const localSettings = useSettingsStore.getState().settings;

  if (!localSettings) return;

  const { data: remoteSettings, error: fetchError } = await supabase
    .from("settings")
    .select("updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (remoteSettings) {
    const localTime = localSettings.updated_at?.getTime() ?? 0;
    const remoteTime = new Date(remoteSettings.updated_at).getTime();

    if (remoteTime > localTime) {
      return;
    }
  }

  const settingsToSync = {
    lock_enabled: localSettings.lockEnabled,
    cursor_color: localSettings.cursorColor,
    text_color: localSettings.textColor,
    cleanup_enabled: localSettings.cleanupEnabled,
    cleanup_prompt: localSettings.cleanupPrompt,
    selected_model: localSettings.selectedModel,
    encrypted_master: localSettings.encryptedMaster,
    key_salt: localSettings.keySalt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("settings")
    .upsert(settingsToSync)
    .eq("user_id", user.id);

  if (error) throw error;

  // Update local settings with new updated_at timestamp
  await useSettingsStore.getState().saveSettings({});
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
