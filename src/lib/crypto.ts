export async function encrypt(text: string, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return { cipher, iv };
}

export async function decrypt(
  cipher: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
) {
  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      cipher
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
  return new TextDecoder().decode(decrypted);
}

export async function deriveKey(password: string, salt?: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltToUse =
    salt ?? new Uint8Array(crypto.getRandomValues(new Uint8Array(16)));

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(saltToUse),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { key, salt: saltToUse };
}
