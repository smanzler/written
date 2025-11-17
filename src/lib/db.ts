import Dexie, { type EntityTable } from "dexie";

interface Journal {
  id: number;
  raw_blob: string | null;
  encrypted_blob: string | null;
  is_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Settings {
  id: number;
  lockEnabled?: boolean;
  cursorColor?: string;
  textColor?: string;
  aiTaggingEnabled?: boolean;
  aiCleanupEnabled?: boolean;
  selectedModel?: string;
}

const db = new Dexie("WrittenDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
  settings: EntityTable<Settings, "id">;
};

db.version(1).stores({
  journals: "++id, title, content, createdAt, updatedAt",
  settings: "id",
});

db.version(2)
  .stores({
    journals:
      "++id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at",
    settings: "id",
  })
  .upgrade(async (tx) => {
    const journals = await tx.table("journals").toArray();

    for (const journal of journals) {
      const rawContent = journal.raw_blob;

      try {
        const parsed = JSON.parse(rawContent);
        if (parsed && parsed.ciphertext) {
          journal.is_encrypted = true;
          journal.encrypted_blob = rawContent;
        } else {
          journal.raw_blob = rawContent;
        }
      } catch (e) {
        journal.raw_blob = rawContent;
      }

      await tx.table("journals").update(journal.id, journal);
    }
  });

export type { Journal, Settings };
export { db };
