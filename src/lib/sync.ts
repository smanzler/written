import { useSyncStore } from "@/stores/syncStore";
import { db, type Journal } from "./db";
import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { DialogType, useDialogStore } from "@/stores/dialogStore";
import { useJournalStore } from "@/stores/journalStore";

export async function sync(): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!user) {
    return;
  }

  const { settings } = useSettingsStore.getState();
  const { isUnlocked } = useJournalStore.getState();

  if (!isUnlocked && settings.lockEnabled) {
    return;
  }

  const syncStore = useSyncStore.getState();

  if (syncStore.isSyncing) {
    return;
  }

  syncStore.setSyncing(true);
  syncStore.setSyncError(null);

  try {
    await pullSettings();
    await pull();

    await pushSettings();
    await push();

    syncStore.setLastSyncAt(new Date());
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
  const { settings } = useSettingsStore.getState();
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

      let transformedRemoteJournal = transformRemote(remoteJournal);

      // check if remote has diff crypto from local settings
      if (remoteJournal.is_encrypted !== settings.lockEnabled) {
        const { decryptText, encryptText } = useJournalStore.getState();
        let journalChanges: Partial<Journal> = {
          raw_blob: null,
          encrypted_blob: null,
          is_encrypted: false,
        };

        if (remoteJournal.is_encrypted) {
          if (!remoteJournal.encrypted_blob) {
            throw new Error("No encrypted blob");
          }

          const { cipher, iv } = JSON.parse(remoteJournal.encrypted_blob);

          if (!cipher || !iv) {
            throw new Error("Incorrectly formatted blob");
          }

          const decryptedText = await decryptText(cipher, iv);

          journalChanges = {
            ...journalChanges,
            raw_blob: decryptedText,
            crypto_applied_at: new Date(),
          };
        } else {
          if (!remoteJournal.raw_blob) {
            throw new Error("No unencrypted content");
          }

          const encryptedText = await encryptText(remoteJournal.raw_blob);

          journalChanges = {
            ...journalChanges,
            encrypted_blob: JSON.stringify(encryptedText),
            is_encrypted: true,
            crypto_applied_at: new Date(),
          };
        }

        transformedRemoteJournal = {
          ...transformedRemoteJournal,
          ...journalChanges,
        };
      }

      if (localJournal) {
        const localUpdatedAt = new Date(localJournal.updated_at).getTime();
        const remoteUpdatedAt = new Date(remoteJournal.updated_at).getTime();

        let resolved: Omit<Journal, "id">;

        if (remoteUpdatedAt > localUpdatedAt) {
          resolved = transformedRemoteJournal;
        } else {
          resolved = localJournal;
        }

        await db.journals.put({
          ...resolved,
          id: localJournal.id,
        });
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

  const { lastSyncAt } = useSyncStore.getState();

  const safeLastSyncAt = lastSyncAt ? lastSyncAt : new Date(0);

  const pendingJournals = await db.journals
    .filter(
      (journal) =>
        journal.updated_at > safeLastSyncAt ||
        (!!journal.crypto_applied_at &&
          journal.crypto_applied_at > safeLastSyncAt)
    )
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
    crypto_applied_at: remote.crypto_applied_at
      ? new Date(remote.crypto_applied_at)
      : null,
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

  const { openDialog } = useDialogStore.getState();

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const settingsStore = useSettingsStore.getState();
  const localSettings = settingsStore.settings;
  const localTime = localSettings.updated_at?.getTime() ?? 0;

  if (!data) {
    return;
  }

  const remoteTime = new Date(data.updated_at ?? 0).getTime();

  const encryptionIsDifferent =
    data.lock_enabled != localSettings.lockEnabled ||
    data.encrypted_master != localSettings.encryptedMaster ||
    data.key_salt != localSettings.keySalt;

  if (encryptionIsDifferent) {
    const buttonsDialogOptions: DialogType = {
      type: "buttons",
      props: {
        title: "Encryption Settings Conflict",
        description:
          "Your encryption settings are different on this device compared to what is saved in the cloud. Would you like to keep your settings from this device, or would you like to use the data from the cloud.",
        buttons: [
          { label: "Keep Local", value: "local", variant: "outline" },
          { label: "Use Cloud", value: "remote", variant: "destructive" },
        ],
      },
    };

    const res = await openDialog(buttonsDialogOptions);

    if (res === "local") {
      return;
    } else if (res === "remote") {
      const { unlock, decryptEntries, encryptEntries } =
        useJournalStore.getState();
      if (data.lock_enabled) {
        if (!data.key_salt) {
          throw new Error("No remote salt found");
        }

        const passwordDialogOptions: DialogType = {
          type: "password",
          props: {
            title: "What is the remote password?",
            description: "nice",
          },
        };
        const password = await openDialog(passwordDialogOptions);

        if (!password) {
          throw new Error("Unable to get key");
        }

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

        const key = await unlock(password);

        if (!key) {
          settingsStore.saveSettings(localSettings);

          throw new Error("Password not correct");
        }

        await encryptEntries(key);
      } else {
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

        await decryptEntries();
      }
    } else {
      throw new Error("Unable to sync due to settings conflict");
    }
  } else if (remoteTime > localTime) {
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

  const settingsToSync = {
    user_id: user.id,
    lock_enabled: localSettings.lockEnabled,
    cursor_color: localSettings.cursorColor,
    text_color: localSettings.textColor,
    cleanup_enabled: localSettings.cleanupEnabled,
    cleanup_prompt: localSettings.cleanupPrompt,
    selected_model: localSettings.selectedModel ?? null,
    encrypted_master: localSettings.encryptedMaster ?? null,
    key_salt: localSettings.keySalt ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("settings").upsert(settingsToSync, {
    onConflict: "user_id",
  });

  if (error) throw error;

  // Update local settings with new updated_at timestamp
  useSettingsStore.getState().saveSettings({});
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
