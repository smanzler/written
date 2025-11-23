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
  deleted_at: Date | null;
  version?: number;
}

const db = new Dexie("WrittenDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
};

db.version(1).stores({
  journals:
    "++id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at, createdAt",
});

db.version(2)
  .stores({
    journals:
      "++id, user_id, server_id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at, synced_at, sync_status",
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

db.version(3)
  .stores({
    journals:
      "++id, user_id, server_id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at, synced_at, sync_status, deleted_at",
  })
  .upgrade(async (tx) => {
    const journals = await tx.table("journals").toCollection().toArray();
    await Promise.all(
      journals.map((journal) =>
        tx.table("journals").update(journal.id, {
          deleted_at: null,
        })
      )
    );
  });

export type { Journal };
export { db };
