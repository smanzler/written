import Dexie, { type EntityTable } from "dexie";

interface Journal {
  id: number;
  user_id: string | null;
  server_id: string | null;
  raw_blob: string | null;
  encrypted_blob: string | null;
  is_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
  synced_at: Date | null;
  sync_status: "pending" | "synced" | "conflict" | "error" | null;
  version?: number;
}

interface Settings {
  id: number;
  lockEnabled?: boolean;
  cursorColor?: string;
  textColor?: string;
  cleanupEnabled?: boolean;
  cleanupPrompt?: string;
  selectedModel?: string;
}

const db = new Dexie("WrittenDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
  settings: EntityTable<Settings, "id">;
};

db.version(1).stores({
  journals:
    "++id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at, createdAt",
  settings: "id",
});

db.version(2)
  .stores({
    journals:
      "++id, user_id, server_id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at, synced_at, sync_status",
    settings: "id",
  })
  .upgrade(async (tx) => {
    const journals = await tx.table("journals").toCollection().toArray();
    await Promise.all(
      journals.map((journal) =>
        tx.table("journals").update(journal.id, {
          user_id: null,
          server_id: null,
          synced_at: null,
          sync_status: null,
          version: 1,
        })
      )
    );
  });

export type { Journal, Settings };
export { db };
