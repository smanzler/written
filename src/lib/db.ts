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
  journals:
    "++id, is_encrypted, raw_blob, encrypted_blob, created_at, updated_at",
  settings: "id",
});

export type { Journal, Settings };
export { db };
