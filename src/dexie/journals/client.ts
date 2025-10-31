import { db } from "@/lib/db";

export const getJournalDates = async () => {
  const journalsArray = await db.journals
    .orderBy("createdAt")
    .reverse()
    .toArray();
  // Group journals by date string in local timezone (YYYY-MM-DD)
  const data = journalsArray.reduce((grouped, journal) => {
    let dateObj: Date;
    if (journal.createdAt instanceof Date) {
      dateObj = journal.createdAt;
    } else {
      dateObj = new Date(journal.createdAt);
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
    .where("createdAt")
    .between(start, end, true, true)
    .toArray();
  return journals;
};
