import Dexie, { type EntityTable } from "dexie";

interface Journal {
  id: number;
  title?: string;
  text: string;
  created_at: Date;
  updated_at: Date;
}

const db = new Dexie("JournalDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
};

db.version(1).stores({
  journals: "++id, title, text, created_at, updated_at",
});

export type { Journal };
export { db };
