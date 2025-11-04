import Dexie, { type EntityTable } from "dexie";

interface Journal {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Settings {
  id: number;
  lockEnabled?: boolean;
  cursorColor?: string;
  textColor?: string;
}

const db = new Dexie("WrittenDatabase") as Dexie & {
  journals: EntityTable<Journal, "id">;
  settings: EntityTable<Settings, "id">;
};

db.version(1).stores({
  journals: "++id, title, content, createdAt, updatedAt",
  settings: "id",
});

export type { Journal, Settings };
export { db };
