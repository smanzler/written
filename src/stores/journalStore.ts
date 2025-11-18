import { create } from "zustand";
import { decrypt, deriveKey, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

// helpers to encode/decode ArrayBuffers
const toBase64 = (buf: Uint8Array<ArrayBuffer>) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (str: string) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

type JournalStoreState = {
  masterKey: CryptoKey | null;
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

export const useJournalStore = create<JournalStoreState>((set, get) => {
  const encryptEntries = async (key?: CryptoKey) => {
    const entries = await db.journals.toArray();
    const { encryptText } = get();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        if (!entry.raw_blob)
          return { key: entry.id, changes: { encrypted_blob: null } };
        const result = await encryptText(entry.raw_blob, key);
        return {
          key: entry.id,
          changes: {
            raw_blob: null,
            encrypted_blob: JSON.stringify(result),
            is_encrypted: true,
          },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  const decryptEntries = async (key?: CryptoKey) => {
    const entries = await db.journals.toArray();
    const { decryptText } = get();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        if (!entry.encrypted_blob)
          return { key: entry.id, changes: { raw_blob: null } };
        const { cipher, iv } = JSON.parse(entry.encrypted_blob);
        const result = await decryptText(cipher, iv, key);
        return {
          key: entry.id,
          changes: {
            raw_blob: result,
            encrypted_blob: null,
            is_encrypted: false,
          },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  return {
    masterKey: null,
    isUnlocked: false,
    async enableEncryption(password: string, force: boolean = false) {
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

      set({ masterKey: imported, isUnlocked: true });
      await encryptEntries(imported);
      return true;
    },
    async disableEncryption(key?: CryptoKey) {
      await decryptEntries(key);

      localStorage.removeItem("encryptedMaster");
      localStorage.removeItem("keySalt");
    },
    async unlock(password: string): Promise<CryptoKey | null> {
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

        set({ masterKey: imported, isUnlocked: true });
        return imported;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    lock() {
      set({ isUnlocked: false, masterKey: null });
    },
    async encryptText(text: string, key?: CryptoKey) {
      const { masterKey } = get();
      const encryptionKey = key ?? masterKey ?? undefined;
      if (!encryptionKey) throw new Error("Journal locked");
      const { cipher, iv } = await encrypt(text, encryptionKey).catch((err) => {
        console.error(err);
        throw err;
      });
      return { cipher: toBase64(new Uint8Array(cipher)), iv: toBase64(iv) };
    },
    async decryptText(cipher: string, iv: string, key?: CryptoKey) {
      const { masterKey } = get();
      const decryptionKey = key ?? masterKey ?? undefined;
      if (!decryptionKey) throw new Error("Journal locked");
      return decrypt(fromBase64(cipher).buffer, fromBase64(iv), decryptionKey);
    },
  };
});
