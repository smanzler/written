import { useLiveQuery } from "dexie-react-hooks";
import { getJournalDates, getJournalsByDate } from "./client";
import { useJournal } from "@/providers/JournalProvider";
import { useEffect, useState } from "react";
import { useSettings } from "@/providers/SettingsProvider";

export const useJournalDates = () => useLiveQuery(getJournalDates);

export const useJournalsByDate = (date?: Date) =>
  useLiveQuery(() => getJournalsByDate(date), [date]);

export const useDecryptedJournalsByDate = (date?: Date) => {
  const journals = useJournalsByDate(date);
  const { decryptText, isUnlocked } = useJournal();
  const { settings } = useSettings();
  const [decrypted, setDecrypted] = useState<Map<number, string>>(new Map());
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    if (!journals || !isUnlocked || !settings?.lockEnabled) {
      setDecrypted(new Map());
      return;
    }

    const decryptAll = async () => {
      setDecrypting(true);
      const decryptedMap = new Map<number, string>();
      for (const journal of journals) {
        console.log("decrypting journal", journal.content);
        if (isEncrypted(journal.content)) {
          try {
            const { cipher, iv } = JSON.parse(journal.content);
            const text = await decryptText(cipher, iv);
            decryptedMap.set(journal.id!, text);
          } catch {
            decryptedMap.set(journal.id!, "[Decryption failed]");
          }
        } else {
          decryptedMap.set(journal.id!, journal.content);
        }
      }
      setDecrypting(false);
      setDecrypted(decryptedMap);
    };

    decryptAll();
  }, [journals, isUnlocked, settings?.lockEnabled, decryptText]);

  return {
    journals: journals?.map((j) => ({
      ...j,
      content:
        decrypted.get(j.id!) ??
        (isEncrypted(j.content) ? "Decrypting..." : j.content),
    })),
    decrypting,
  };
};

const isEncrypted = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return (
      parsed &&
      typeof parsed.cipher === "string" &&
      typeof parsed.iv === "string"
    );
  } catch {
    return false;
  }
};
