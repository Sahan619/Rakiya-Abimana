import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const NONCE_LENGTH_BYTES = 12;
const LEGACY_IV_LENGTH_BYTES = 16;
const AUTH_TAG_LENGTH_BYTES = 16;
const VERSION = "v2";

function isHex(value: string): boolean {
  return value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value);
}

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.ENCRYPTION_KEY;

  if (
    typeof configuredKey !== "string" ||
    configuredKey.length !== KEY_LENGTH_BYTES * 2 ||
    !/^[0-9a-f]{64}$/i.test(configuredKey)
  ) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hexadecimal value");
  }

  return Buffer.from(configuredKey, "hex");
}

/** Validate the required AES-256 key without exposing its value. */
export function validateEncryptionKey(): void {
  getEncryptionKey();
}

function parseHex(value: string, expectedBytes: number, fieldName: string): Buffer {
  if (!isHex(value) || value.length !== expectedBytes * 2) {
    throw new Error(`Invalid encrypted data ${fieldName}`);
  }

  return Buffer.from(value, "hex");
}

function decryptWithParameters(
  ciphertextHex: string,
  nonce: Buffer,
  authTag: Buffer
): string {
  const ciphertext = parseHex(ciphertextHex, Math.max(1, ciphertextHex.length / 2), "ciphertext");
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), nonce);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error("Unable to decrypt encrypted data");
  }
}

/**
 * Encrypt non-empty text using AES-256-GCM.
 * Output format: `v2:nonceHex:ciphertextHex:authTagHex`.
 */
export function encryptData(plainText: string): string {
  if (typeof plainText !== "string" || plainText.trim().length === 0) {
    throw new Error("Plaintext must be a non-empty string");
  }

  const nonce = crypto.randomBytes(NONCE_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error("Unexpected authentication tag length");
  }

  return `${VERSION}:${nonce.toString("hex")}:${ciphertext.toString("hex")}:${authTag.toString("hex")}`;
}

/**
 * Decrypt v2 payloads and the legacy `ivHex:authTagHex:ciphertextHex` format.
 */
export function decryptData(cipherPayload: string): string {
  if (typeof cipherPayload !== "string" || cipherPayload.length === 0) {
    throw new Error("Invalid encrypted data format");
  }

  const parts = cipherPayload.split(":");

  if (parts.length === 4 && parts[0] === VERSION) {
    const [, nonceHex, ciphertextHex, authTagHex] = parts;
    const nonce = parseHex(nonceHex, NONCE_LENGTH_BYTES, "nonce");
    const authTag = parseHex(authTagHex, AUTH_TAG_LENGTH_BYTES, "authentication tag");

    if (!isHex(ciphertextHex) || ciphertextHex.length === 0) {
      throw new Error("Invalid encrypted data ciphertext");
    }

    return decryptWithParameters(ciphertextHex, nonce, authTag);
  }

  if (parts.length === 3) {
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = parseHex(ivHex, LEGACY_IV_LENGTH_BYTES, "legacy IV");
    const authTag = parseHex(authTagHex, AUTH_TAG_LENGTH_BYTES, "authentication tag");

    if (!isHex(ciphertextHex) || ciphertextHex.length === 0) {
      throw new Error("Invalid encrypted data ciphertext");
    }

    return decryptWithParameters(ciphertextHex, iv, authTag);
  }

  throw new Error("Invalid encrypted data format");
}

