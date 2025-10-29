import Dexie, { type EntityTable } from "dexie";

interface Journal {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie("WrittenDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
};

db.version(1).stores({
  journals: "++id, title, content, createdAt, updatedAt",
});

export type { Journal };
export { db };
