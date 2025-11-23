import { db, Journal } from "@/lib/db";

export const getJournalDates = async () => {
  const journalsArray = await db.journals
    .orderBy("created_at")
    .reverse()
    .filter((journal) => !journal.deleted_at)
    .toArray();
  // Group journals by date string in local timezone (YYYY-MM-DD)
  const data = journalsArray.reduce((grouped, journal) => {
    let dateObj: Date;
    if (journal.created_at instanceof Date) {
      dateObj = journal.created_at;
    } else {
      dateObj = new Date(journal.created_at);
    }
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const localDate = `${year}-${month}-${day}`;
    if (!grouped.includes(localDate)) {
      grouped.push(localDate);
    }
    return grouped;
  }, [] as string[]);

  return data;
};

export const getJournalsByDate = async (date?: Date) => {
  if (!date || isNaN(date.getTime())) return [];
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const journals = await db.journals
    .where("created_at")
    .between(start, end, true, true)
    .filter((journal) => !journal.deleted_at)
    .toArray();
  return journals;
};

export const deleteJournal = async (id: number) => {
  const journal = await db.journals.get(id);
  if (!journal) return;

  await db.journals.update(id, {
    deleted_at: new Date(),
    sync_status: journal.server_id ? "pending" : null,
    updated_at: new Date(),
  });
};

export const updateJournal = async (id: number, data: Partial<Journal>) => {
  await db.journals.update(id, data);
};
