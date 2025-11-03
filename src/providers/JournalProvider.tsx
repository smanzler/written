import { decrypt, deriveKey, encrypt } from "@/lib/crypto";
import React, { createContext, useContext, useEffect, useState } from "react";

// helpers to encode/decode ArrayBuffers
const toBase64 = (buf: Uint8Array<ArrayBuffer>) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (str: string) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

type JournalContextType = {
  isUnlocked: boolean;
  createPassword: (password: string, force?: boolean) => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  encryptText: (text: string) => Promise<{ cipher: string; iv: string }>;
  decryptText: (cipher: string, iv: string) => Promise<string>;
};

const JournalContext = createContext<JournalContextType | null>(null);
export const useJournal = () => useContext(JournalContext)!;

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isUnlocked, setUnlocked] = useState(false);

  const createPassword = async (password: string, force: boolean = false) => {
    const storedEncryptedMaster = localStorage.getItem("encryptedMaster");
    const storedSalt = localStorage.getItem("keySalt");

    if ((storedEncryptedMaster || storedSalt) && !force) return false;

    const newMaster = crypto.getRandomValues(new Uint8Array(32));
    const { key, salt } = await deriveKey(password);

    console.log(key, salt);

    // encrypt master key with password key
    const { cipher, iv } = await encrypt(toBase64(newMaster), key);
    console.log(cipher, iv);

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
    return true;
  };

  async function unlock(password: string): Promise<boolean> {
    const storedEncryptedMaster = localStorage.getItem("encryptedMaster");
    const storedSalt = localStorage.getItem("keySalt");
    console.log("storedEncryptedMaster", storedEncryptedMaster);
    console.log("storedSalt", storedSalt);

    if (!storedEncryptedMaster || !storedSalt) {
      return false;
    }

    // existing user — decrypt master key
    try {
      const salt = fromBase64(storedSalt);
      console.log("salt", salt);
      const { key } = await deriveKey(password, salt);
      console.log("key", key);
      const { cipher, iv } = JSON.parse(storedEncryptedMaster);
      const decrypted = await decrypt(
        fromBase64(cipher).buffer,
        fromBase64(iv),
        key
      );
      console.log("decrypted", decrypted);
      const rawMaster = fromBase64(decrypted);

      const imported = await crypto.subtle.importKey(
        "raw",
        rawMaster,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );

      console.log(imported);

      setMasterKey(imported);
      setUnlocked(true);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  function lock() {
    setUnlocked(false);
    setMasterKey(null);
  }

  async function encryptText(text: string) {
    if (!masterKey) throw new Error("Journal locked");
    const { cipher, iv } = await encrypt(text, masterKey);
    return { cipher: toBase64(new Uint8Array(cipher)), iv: toBase64(iv) };
  }

  async function decryptText(cipher: string, iv: string) {
    if (!masterKey) throw new Error("Journal locked");
    return decrypt(fromBase64(cipher).buffer, fromBase64(iv), masterKey);
  }

  useEffect(() => {
    console.log("isUnlocked from useEffect context", isUnlocked);
  }, [isUnlocked]);

  return (
    <JournalContext.Provider
      value={{
        isUnlocked,
        createPassword,
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
