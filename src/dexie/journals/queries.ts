import { useLiveQuery } from "dexie-react-hooks";
import { getJournalDates, getJournalsByDate } from "./client";
import { useJournalStore } from "@/stores/journalStore";
import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Journal } from "@/lib/db";

type JournalBlob = {
  content?: string;
  cleaned_content?: string | null;
  error?: string;
};

export type DecryptedJournal = Journal & JournalBlob;

type UseDecryptedJournalsByDateReturn = {
  journals: DecryptedJournal[];
  decrypting: boolean;
};

export const useJournalDates = () => useLiveQuery(getJournalDates);
export const useJournalsByDate = (date?: Date) =>
  useLiveQuery(() => getJournalsByDate(date), [date]);

export const useDecryptedJournalsByDate = (
  date?: Date
): UseDecryptedJournalsByDateReturn => {
  const journals = useJournalsByDate(date);
  const { decryptText, isUnlocked } = useJournalStore();
  const { settings } = useSettingsStore();

  const [decrypted, setDecrypted] = useState<Map<number, JournalBlob>>(
    new Map()
  );
  const [decrypting, setDecrypting] = useState(false);

  const journalsKey = useMemo(() => {
    if (!journals) return null;
    return journals.map((j) => `${j.id}-${j.updated_at.getTime()}`).join(",");
  }, [journals]);

  useEffect(() => {
    if (!journals || !isUnlocked || !settings.lockEnabled) {
      setDecrypted(new Map());
      setDecrypting(false);
      return;
    }

    let cancelled = false;

    const decryptAll = async () => {
      setDecrypting(true);

      const entries = await Promise.all(
        journals.map(async (journal) => {
          if (!journal.is_encrypted) {
            return [journal.id!, JSON.parse(journal.raw_blob ?? "{}")] as const;
          }

          try {
            if (!journal.encrypted_blob) {
              return [journal.id!, { error: "[Decryption failed]" }] as const;
            }
            const { cipher, iv } = JSON.parse(journal.encrypted_blob);
            const blob = await decryptText(cipher, iv);
            return [journal.id!, JSON.parse(blob)] as const;
          } catch {
            return [journal.id!, { error: "[Decryption failed]" }] as const;
          }
        })
      );

      if (!cancelled) {
        setDecrypted(new Map(entries));
        setDecrypting(false);
      }
    };

    decryptAll();

    return () => {
      cancelled = true;
    };
    // Use journalsKey instead of journals array to prevent unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalsKey, isUnlocked, settings.lockEnabled]);

  const merged = useMemo((): DecryptedJournal[] => {
    if (!journals) return [];
    return journals.map((j): DecryptedJournal => {
      const blob = decrypted.get(j.id!);

      let blobData: JournalBlob;

      if (blob) {
        blobData = blob;
      } else if (j.is_encrypted) {
        blobData = { content: "Decrypting..." };
      } else if (j.raw_blob) {
        try {
          blobData = JSON.parse(j.raw_blob) as JournalBlob;
        } catch {
          blobData = { content: j.raw_blob };
        }
      } else {
        blobData = {};
      }

      return {
        ...j,
        ...blobData,
      };
    });
  }, [journals, decrypted]);

  return {
    journals: merged,
    decrypting,
  };
};
