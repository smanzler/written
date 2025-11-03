import { decrypt, deriveKey, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import React, { createContext, useContext, useState } from "react";

// helpers to encode/decode ArrayBuffers
const toBase64 = (buf: Uint8Array<ArrayBuffer>) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (str: string) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

type JournalContextType = {
  isUnlocked: boolean;
  enableEncryption: (password: string, force?: boolean) => Promise<boolean>;
  disableEncryption: (key?: CryptoKey) => Promise<void>;
  unlock: (password: string) => Promise<CryptoKey | null>;
  lock: () => void;
  encryptText: (
    text: string,
    key?: CryptoKey
  ) => Promise<{ cipher: string; iv: string }>;
  decryptText: (cipher: string, iv: string, key?: CryptoKey) => Promise<string>;
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isUnlocked, setUnlocked] = useState(false);
  const enableEncryption = async (password: string, force: boolean = false) => {
    const storedEncryptedMaster = localStorage.getItem("encryptedMaster");
    const storedSalt = localStorage.getItem("keySalt");

    if ((storedEncryptedMaster || storedSalt) && !force) return false;

    const newMaster = crypto.getRandomValues(new Uint8Array(32));
    const { key, salt } = await deriveKey(password);

    // encrypt master key with password key
    const { cipher, iv } = await encrypt(toBase64(newMaster), key);

    localStorage.setItem(
      "encryptedMaster",
      JSON.stringify({
        cipher: toBase64(new Uint8Array(cipher)),
        iv: toBase64(iv),
      })
    );
    localStorage.setItem("keySalt", toBase64(new Uint8Array(salt)));

    const imported = await crypto.subtle.importKey(
      "raw",
      newMaster,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    setMasterKey(imported);
    setUnlocked(true);
    await encryptEntries(imported);
    return true;
  };

  const disableEncryption = async (key?: CryptoKey) => {
    await decryptEntries(key);

    localStorage.removeItem("encryptedMaster");
    localStorage.removeItem("keySalt");
  };

  async function unlock(password: string): Promise<CryptoKey | null> {
    const storedEncryptedMaster = localStorage.getItem("encryptedMaster");
    const storedSalt = localStorage.getItem("keySalt");

    if (!storedEncryptedMaster || !storedSalt) {
      return null;
    }

    // existing user — decrypt master key
    try {
      const salt = fromBase64(storedSalt);
      const { key } = await deriveKey(password, salt);
      const { cipher, iv } = JSON.parse(storedEncryptedMaster);
      const decrypted = await decrypt(
        fromBase64(cipher).buffer,
        fromBase64(iv),
        key
      );
      const rawMaster = fromBase64(decrypted);

      const imported = await crypto.subtle.importKey(
        "raw",
        rawMaster,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );

      setMasterKey(imported);
      setUnlocked(true);
      return imported;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  function lock() {
    setUnlocked(false);
    setMasterKey(null);
  }

  async function encryptText(text: string, key?: CryptoKey) {
    if (!key) {
      key = masterKey ?? undefined;
    }
    if (!key) throw new Error("Journal locked");
    const { cipher, iv } = await encrypt(text, key).catch((err) => {
      console.error(err);
      throw err;
    });
    return { cipher: toBase64(new Uint8Array(cipher)), iv: toBase64(iv) };
  }

  async function decryptText(cipher: string, iv: string, key?: CryptoKey) {
    if (!key) {
      key = masterKey ?? undefined;
    }
    if (!key) throw new Error("Journal locked");
    return decrypt(fromBase64(cipher).buffer, fromBase64(iv), key);
  }

  const encryptEntries = async (key?: CryptoKey) => {
    const entries = await db.journals.toArray();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        const result = await encryptText(entry.content, key);
        return {
          key: entry.id,
          changes: { content: JSON.stringify(result) },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  const decryptEntries = async (key?: CryptoKey) => {
    const entries = await db.journals.toArray();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        const { cipher, iv } = JSON.parse(entry.content);
        const result = await decryptText(cipher, iv, key);
        return {
          key: entry.id,
          changes: { content: result },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  return (
    <JournalContext.Provider
      value={{
        isUnlocked,
        enableEncryption,
        disableEncryption,
        unlock,
        lock,
        encryptText,
        decryptText,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

const JournalContext = createContext<JournalContextType | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useJournal = () => useContext(JournalContext)!;
