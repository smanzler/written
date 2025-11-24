import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sync,
  pull,
  push,
  pullSettings,
  pushSettings,
  transformRemote,
  transformLocal,
} from "../sync";
import { db, type Journal } from "../db";
import { supabase } from "../supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSyncStore } from "@/stores/syncStore";
import { useJournalStore } from "@/stores/journalStore";
import { useDialogStore } from "@/stores/dialogStore";

vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../db", () => ({
  db: {
    journals: {
      where: vi.fn(),
      filter: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      put: vi.fn(),
      toArray: vi.fn(),
    },
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/stores/syncStore", () => ({
  useSyncStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/stores/journalStore", () => ({
  useJournalStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/stores/dialogStore", () => ({
  useDialogStore: {
    getState: vi.fn(),
  },
}));

const createResultProvider = (
  results: Array<{ error?: any; data?: any }>
): (() => Promise<{ error?: any; data?: any }>) => {
  let index = 0;
  return () => {
    const current = results[index] ??
      results[results.length - 1] ?? { error: null };
    index += 1;
    return Promise.resolve(current);
  };
};

const createUpdateBuilder = (
  resultProvider: () => Promise<{ error?: any; data?: any }>
) => {
  const builder: any = {};
  let eqCalls = 0;
  builder.eq = vi.fn().mockImplementation(() => {
    eqCalls += 1;
    if (eqCalls < 2) {
      return builder;
    }
    eqCalls = 0;
    return resultProvider();
  });
  return builder;
};

describe("sync", () => {
  const mockUser = { id: "user-123" };
  const mockSettings = {
    lockEnabled: false,
    cursorColor: "#000",
    textColor: "#000",
    cleanupEnabled: false,
    cleanupPrompt: "",
    selectedModel: undefined,
    encryptedMaster: undefined,
    keySalt: undefined,
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore.getState as any).mockReturnValue({
      user: mockUser,
    });

    (useSettingsStore.getState as any).mockReturnValue({
      settings: mockSettings,
      saveSettings: vi.fn(),
    });

    (useSyncStore.getState as any).mockReturnValue({
      isSyncing: false,
      lastSyncAt: null,
      setSyncing: vi.fn(),
      setSyncError: vi.fn(),
      setLastSyncAt: vi.fn(),
    });

    (useJournalStore.getState as any).mockReturnValue({
      isUnlocked: true,
      decryptText: vi.fn(),
      encryptText: vi.fn(),
    });

    (useDialogStore.getState as any).mockReturnValue({
      openDialog: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sync()", () => {
    it("should return early if user is not authenticated", async () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      await sync();

      expect(useSyncStore.getState().setSyncing).not.toHaveBeenCalled();
    });

    it("should return early if journal is locked and lock is enabled", async () => {
      (useSettingsStore.getState as any).mockReturnValue({
        settings: { ...mockSettings, lockEnabled: true },
      });
      (useJournalStore.getState as any).mockReturnValue({
        isUnlocked: false,
      });

      await sync();

      expect(useSyncStore.getState().setSyncing).not.toHaveBeenCalled();
    });

    it("should return early if sync is already in progress", async () => {
      (useSyncStore.getState as any).mockReturnValue({
        isSyncing: true,
        lastSyncAt: null,
        setSyncing: vi.fn(),
        setSyncError: vi.fn(),
        setLastSyncAt: vi.fn(),
      });

      await sync();

      expect(useSyncStore.getState().setSyncing).not.toHaveBeenCalled();
    });

    it("should execute full sync when conditions are met", async () => {
      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const mockDbQuery = {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };

      (db.journals.where as any).mockReturnValue(mockDbQuery);
      (db.journals.filter as any).mockReturnValue(mockDbQuery);

      const syncStore = useSyncStore.getState();
      await sync();

      expect(syncStore.setSyncing).toHaveBeenCalledWith(true);
      expect(syncStore.setSyncing).toHaveBeenCalledWith(false);
      expect(syncStore.setLastSyncAt).toHaveBeenCalled();
    });

    it("should handle sync errors and set error state", async () => {
      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const syncStore = useSyncStore.getState();

      await expect(sync()).rejects.toThrow();
      expect(syncStore.setSyncError).toHaveBeenCalled();
      expect(syncStore.setSyncing).toHaveBeenCalledWith(false);
    });
  });

  describe("pull()", () => {
    it("should return early if user is not authenticated", async () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      await pull();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should fetch and sync journals from remote", async () => {
      const mockRemoteJournal = {
        id: "server-123",
        user_id: "user-123",
        raw_blob: "test content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockRemoteJournal],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const mockDbQuery = {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null), // No local journal exists
        }),
      };

      (db.journals.where as any).mockReturnValue(mockDbQuery);
      (db.journals.add as any).mockResolvedValue(undefined);

      await pull();

      expect(supabase.from).toHaveBeenCalledWith("journals");
      expect(db.journals.add).toHaveBeenCalled();
    });

    it("should handle encryption mismatch when remote is encrypted", async () => {
      const mockRemoteJournal = {
        id: "server-123",
        user_id: "user-123",
        raw_blob: null,
        encrypted_blob: JSON.stringify({ cipher: "cipher", iv: "iv" }),
        is_encrypted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        crypto_applied_at: null,
      };

      (useSettingsStore.getState as any).mockReturnValue({
        settings: { ...mockSettings, lockEnabled: false },
        saveSettings: vi.fn(),
      });

      const mockDecryptText = vi.fn().mockResolvedValue("decrypted content");
      (useJournalStore.getState as any).mockReturnValue({
        isUnlocked: true,
        decryptText: mockDecryptText,
        encryptText: vi.fn(),
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockRemoteJournal],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const mockDbQuery = {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      };

      (db.journals.where as any).mockReturnValue(mockDbQuery);
      (db.journals.add as any).mockResolvedValue(undefined);

      await pull();

      expect(mockDecryptText).toHaveBeenCalled();
      expect(db.journals.add).toHaveBeenCalledWith(
        expect.objectContaining({
          raw_blob: "decrypted content",
          is_encrypted: false,
          crypto_applied_at: expect.any(Date),
        })
      );
    });

    it("should resolve conflicts by taking newer version", async () => {
      const now = new Date();
      const older = new Date(now.getTime() - 1000);
      const newer = new Date(now.getTime() + 1000);

      const mockRemoteJournal = {
        id: "server-123",
        user_id: "user-123",
        raw_blob: "remote content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: newer.toISOString(),
        updated_at: newer.toISOString(),
        deleted_at: null,
        crypto_applied_at: null,
      };

      const localJournal: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "local content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: older,
        updated_at: older,
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockRemoteJournal],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const mockDbQuery = {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(localJournal),
        }),
      };

      (db.journals.where as any).mockReturnValue(mockDbQuery);
      (db.journals.put as any).mockResolvedValue(undefined);

      await pull();

      expect(db.journals.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          raw_blob: "remote content", // Should use remote (newer) version
        })
      );
    });
  });

  describe("push()", () => {
    it("should return early if user is not authenticated", async () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      await push();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should push new journals to server", async () => {
      const localJournal: Journal = {
        id: 1,
        server_id: null,
        user_id: "user-123",
        raw_blob: "test content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockDbQuery = {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([localJournal]),
      };

      (db.journals.filter as any).mockReturnValue(mockDbQuery);

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "server-123" },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);
      (db.journals.update as any).mockResolvedValue(undefined);

      await push();

      expect(supabase.from).toHaveBeenCalledWith("journals");
      expect(mockSupabaseQuery.insert).toHaveBeenCalled();
      expect(db.journals.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          server_id: "server-123",
          sync_status: "synced",
        })
      );
    });

    it("should update existing journals on server", async () => {
      const localJournal: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "updated content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockDbQuery = {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([localJournal]),
      };

      (db.journals.filter as any).mockReturnValue(mockDbQuery);

      const updateBuilder = createUpdateBuilder(
        createResultProvider([{ error: null }])
      );
      const updateMock = vi.fn().mockReturnValue(updateBuilder);
      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });
      (db.journals.update as any).mockResolvedValue(undefined);

      await push();

      expect(updateMock).toHaveBeenCalled();
      expect(updateBuilder.eq).toHaveBeenCalled();
      expect(db.journals.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sync_status: "synced",
        })
      );
    });

    it("should handle errors and mark journals with error status", async () => {
      const localJournal: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "test content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockDbQuery = {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([localJournal]),
      };

      (db.journals.filter as any).mockReturnValue(mockDbQuery);

      const permissionError: any = new Error("Permission denied");
      permissionError.status = 403;

      const updateBuilder = createUpdateBuilder(
        createResultProvider([{ error: permissionError }])
      );
      const updateMock = vi.fn().mockReturnValue(updateBuilder);
      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });
      (db.journals.update as any).mockResolvedValue(undefined);

      await expect(push()).rejects.toThrow();

      expect(db.journals.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sync_status: "error",
        })
      );
    });

    it("should retry transient errors", async () => {
      const localJournal: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "test content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date(),
        updated_at: new Date(),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const mockDbQuery = {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([localJournal]),
      };

      (db.journals.filter as any).mockReturnValue(mockDbQuery);

      let attempt = 0;
      const resultProvider = async () => {
        attempt++;
        if (attempt === 1) {
          const error: any = new Error("Network error");
          error.status = 500;
          return { error };
        }
        return { error: null };
      };

      const updateMock = vi
        .fn()
        .mockReturnValue(createUpdateBuilder(resultProvider));

      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });
      (db.journals.update as any).mockResolvedValue(undefined);

      vi.useFakeTimers();
      try {
        const pushPromise = push();
        await vi.runAllTimersAsync();
        await pushPromise;
      } finally {
        vi.useRealTimers();
      }

      expect(attempt).toBeGreaterThan(1); // Should have retried
      expect(db.journals.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sync_status: "synced",
        })
      );
    });
  });

  describe("pullSettings()", () => {
    it("should return early if user is not authenticated", async () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      await pullSettings();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should not update settings when no remote record exists", async () => {
      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: mockSettings,
        saveSettings: mockSaveSettings,
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pullSettings();

      expect(mockSaveSettings).not.toHaveBeenCalled();
    });

    it("should throw when Supabase returns an error", async () => {
      (useSettingsStore.getState as any).mockReturnValue({
        settings: mockSettings,
        saveSettings: vi.fn(),
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("boom"),
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await expect(pullSettings()).rejects.toThrow("boom");
    });

    it("should update local settings when remote is newer", async () => {
      const remoteSettings = {
        lock_enabled: false,
        cursor_color: "#ff0000",
        text_color: "#000000",
        cleanup_enabled: true,
        cleanup_prompt: "test prompt",
        selected_model: "gpt-4",
        encrypted_master: null,
        key_salt: null,
        updated_at: new Date().toISOString(),
      };

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: remoteSettings,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: {
          ...mockSettings,
          updated_at: new Date(Date.now() - 10000), // Older than remote
        },
        saveSettings: mockSaveSettings,
      });

      await pullSettings();

      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          lockEnabled: false,
          cursorColor: "#ff0000",
          textColor: "#000000",
          cleanupEnabled: true,
          cleanupPrompt: "test prompt",
          selectedModel: "gpt-4",
        })
      );
    });

    it("should handle encryption settings conflict", async () => {
      const remoteSettings = {
        lock_enabled: true,
        cursor_color: "#000",
        text_color: "#000",
        cleanup_enabled: false,
        cleanup_prompt: "",
        selected_model: null,
        encrypted_master: "encrypted",
        key_salt: "salt",
        updated_at: new Date().toISOString(),
      };

      (useSettingsStore.getState as any).mockReturnValue({
        settings: {
          ...mockSettings,
          lockEnabled: false, // Different from remote
          encryptedMaster: undefined,
          keySalt: undefined,
        },
        saveSettings: vi.fn(),
      });

      const mockOpenDialog = vi.fn().mockResolvedValue("remote");
      (useDialogStore.getState as any).mockReturnValue({
        openDialog: mockOpenDialog,
      });

      // Mock CryptoKey - can't instantiate directly
      const mockCryptoKey = {} as CryptoKey;
      const mockUnlock = vi.fn().mockResolvedValue(mockCryptoKey);
      const mockEncryptEntries = vi.fn().mockResolvedValue(undefined);
      (useJournalStore.getState as any).mockReturnValue({
        isUnlocked: true,
        unlock: mockUnlock,
        encryptEntries: mockEncryptEntries,
        decryptEntries: vi.fn(),
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: remoteSettings,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pullSettings();

      expect(mockOpenDialog).toHaveBeenCalled();
    });

    it("should skip update when remote settings are older than local", async () => {
      const remoteSettings = {
        lock_enabled: false,
        cursor_color: "#111111",
        text_color: "#222222",
        cleanup_enabled: false,
        cleanup_prompt: "",
        selected_model: null,
        encrypted_master: null,
        key_salt: null,
        updated_at: new Date(Date.now() - 60_000).toISOString(), // older
      };

      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: {
          ...mockSettings,
          updated_at: new Date(), // newer than remote
        },
        saveSettings: mockSaveSettings,
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: remoteSettings,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pullSettings();

      expect(mockSaveSettings).not.toHaveBeenCalled();
    });

    it("should allow user to keep local settings during conflict", async () => {
      const remoteSettings = {
        lock_enabled: true,
        cursor_color: "#000",
        text_color: "#000",
        cleanup_enabled: false,
        cleanup_prompt: "",
        selected_model: null,
        encrypted_master: "remote-master",
        key_salt: "remote-salt",
        updated_at: new Date().toISOString(),
      };

      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: {
          ...mockSettings,
          lockEnabled: false,
        },
        saveSettings: mockSaveSettings,
      });

      const mockOpenDialog = vi.fn().mockResolvedValue("local");
      (useDialogStore.getState as any).mockReturnValue({
        openDialog: mockOpenDialog,
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: remoteSettings,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pullSettings();

      expect(mockOpenDialog).toHaveBeenCalled();
      expect(mockSaveSettings).not.toHaveBeenCalledWith(
        expect.objectContaining({ lockEnabled: true })
      );
    });

    it("should decrypt entries when adopting remote unlocked settings", async () => {
      const remoteSettings = {
        lock_enabled: false,
        cursor_color: "#123456",
        text_color: "#654321",
        cleanup_enabled: true,
        cleanup_prompt: "remote prompt",
        selected_model: "remote-model",
        encrypted_master: null,
        key_salt: null,
        updated_at: new Date().toISOString(),
      };

      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: {
          ...mockSettings,
          lockEnabled: true,
          encryptedMaster: "local-master",
          keySalt: "local-salt",
        },
        saveSettings: mockSaveSettings,
      });

      const mockOpenDialog = vi.fn().mockResolvedValue("remote");
      (useDialogStore.getState as any).mockReturnValue({
        openDialog: mockOpenDialog,
      });

      const mockDecryptEntries = vi.fn().mockResolvedValue(undefined);
      (useJournalStore.getState as any).mockReturnValue({
        isUnlocked: true,
        decryptEntries: mockDecryptEntries,
        encryptEntries: vi.fn(),
        unlock: vi.fn(),
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: remoteSettings,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pullSettings();

      expect(mockOpenDialog).toHaveBeenCalled();
      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          lockEnabled: false,
          cleanupPrompt: "remote prompt",
          selectedModel: "remote-model",
        })
      );
      expect(mockDecryptEntries).toHaveBeenCalled();
    });
  });

  describe("pushSettings()", () => {
    it("should return early if user is not authenticated", async () => {
      (useAuthStore.getState as any).mockReturnValue({ user: null });

      await pushSettings();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should push settings to server", async () => {
      const mockSaveSettings = vi.fn();
      (useSettingsStore.getState as any).mockReturnValue({
        settings: mockSettings,
        saveSettings: mockSaveSettings,
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await pushSettings();

      expect(supabase.from).toHaveBeenCalledWith("settings");
      expect(mockSupabaseQuery.upsert).toHaveBeenCalled();
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it("should handle errors when pushing settings", async () => {
      (useSettingsStore.getState as any).mockReturnValue({
        settings: mockSettings,
        saveSettings: vi.fn(),
      });

      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({
          error: { message: "Failed to sync" },
        }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseQuery);

      await expect(pushSettings()).rejects.toThrow();
    });
  });

  describe("transformRemote()", () => {
    it("should transform remote journal to local format", () => {
      const remote = {
        id: "server-123",
        user_id: "user-123",
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        deleted_at: null,
        crypto_applied_at: null,
      };

      const result = transformRemote(remote);

      expect(result).toEqual({
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-02T00:00:00Z"),
        synced_at: expect.any(Date),
        sync_status: "synced",
        deleted_at: null,
        crypto_applied_at: null,
      });
    });

    it("should handle deleted_at and crypto_applied_at dates", () => {
      const remote = {
        id: "server-123",
        user_id: "user-123",
        raw_blob: null,
        encrypted_blob: null,
        is_encrypted: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        deleted_at: "2024-01-03T00:00:00Z",
        crypto_applied_at: "2024-01-04T00:00:00Z",
      };

      const result = transformRemote(remote);

      expect(result.deleted_at).toEqual(new Date("2024-01-03T00:00:00Z"));
      expect(result.crypto_applied_at).toEqual(
        new Date("2024-01-04T00:00:00Z")
      );
    });
  });

  describe("transformLocal()", () => {
    it("should transform local journal to remote format", () => {
      const local: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-02T00:00:00Z"),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: null,
      };

      const result = transformLocal(local);

      expect(result).toEqual({
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      });
    });

    it("should include deleted_at when present", () => {
      const local: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-02T00:00:00Z"),
        synced_at: null,
        sync_status: null,
        deleted_at: new Date("2024-01-03T00:00:00Z"),
        crypto_applied_at: null,
      };

      const result = transformLocal(local);

      expect(result.deleted_at).toBe("2024-01-03T00:00:00.000Z");
    });

    it("should include crypto_applied_at when present", () => {
      const local: Journal = {
        id: 1,
        server_id: "server-123",
        user_id: "user-123",
        raw_blob: "content",
        encrypted_blob: null,
        is_encrypted: false,
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-02T00:00:00Z"),
        synced_at: null,
        sync_status: null,
        deleted_at: null,
        crypto_applied_at: new Date("2024-01-04T00:00:00Z"),
      };

      const result = transformLocal(local);

      expect(result.crypto_applied_at).toBe("2024-01-04T00:00:00.000Z");
    });
  });
});
