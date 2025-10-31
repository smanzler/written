import { useLiveQuery } from "dexie-react-hooks";
import { getJournalDates, getJournalsByDate } from "./client";

export const useJournalDates = () => useLiveQuery(getJournalDates);

export const useJournalsByDate = (date?: Date) =>
  useLiveQuery(() => getJournalsByDate(date), [date]);
