/**
 * Web Crypto API End-to-End Encryption (E2EE) helper using AES-GCM
 */

export async function generateKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKeyToString(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode(...exportedKeyBuffer));
}

export async function importKeyFromString(keyStr: string): Promise<CryptoKey> {
  const binaryKey = atob(keyStr);
  const bytes = new Uint8Array(binaryKey.length);
  for (let i = 0; i < binaryKey.length; i++) {
    bytes[i] = binaryKey.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(data)
  );

  const cipherText = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivStr = btoa(String.fromCharCode(...iv));
  return { cipherText, iv: ivStr };
}

export async function decryptData(cipherText: string, ivStr: string, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const binaryCipher = atob(cipherText);
  const cipherBytes = new Uint8Array(binaryCipher.length);
  for (let i = 0; i < binaryCipher.length; i++) {
    cipherBytes[i] = binaryCipher.charCodeAt(i);
  }

  const binaryIv = atob(ivStr);
  const ivBytes = new Uint8Array(binaryIv.length);
  for (let i = 0; i < binaryIv.length; i++) {
    ivBytes[i] = binaryIv.charCodeAt(i);
  }

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    cipherBytes.buffer
  );

  return dec.decode(decrypted);
}
