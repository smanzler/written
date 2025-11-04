import { Journal } from "@/lib/db";
import { deleteJournal, updateJournal } from "./client";

export const useDeleteJournal = () => {
  return async (id: number) => {
    await deleteJournal(id);
  };
};

export const useUpdateJournal = () => {
  return async (id: number, data: Partial<Journal>) => {
    await updateJournal(id, data);
  };
};
