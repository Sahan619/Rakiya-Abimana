import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, test } from "node:test";
import { decryptData, encryptData, validateEncryptionKey } from "./crypto.service";

const testKey = "1111111111111111111111111111111111111111111111111111111111111111";
const wrongKey = "2222222222222222222222222222222222222222222222222222222222222222";
const fictionalNic = "TEST-NIC-0001";
const originalKey = process.env.ENCRYPTION_KEY;

process.env.ENCRYPTION_KEY = testKey;

function createLegacyPayload(plainText: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(testKey, "hex"), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${ciphertext.toString("hex")}`;
}

test("encrypts and decrypts a fictional NIC value", () => {
  const payload = encryptData(fictionalNic);
  assert.equal(decryptData(payload), fictionalNic);
});

test("uses the v2 format and a 12-byte nonce", () => {
  const [, nonceHex] = encryptData(fictionalNic).split(":");
  assert.equal(nonceHex.length, 24);
});

test("uses a different nonce and ciphertext for repeated encryptions", () => {
  const first = encryptData(fictionalNic).split(":");
  const second = encryptData(fictionalNic).split(":");
  assert.notEqual(first[1], second[1]);
  assert.notEqual(first[2], second[2]);
});

test("rejects tampered ciphertext and authentication tag", () => {
  const payload = encryptData(fictionalNic).split(":");
  payload[2] = `${payload[2].slice(0, -2)}00`;
  assert.throws(() => decryptData(payload.join(":")));

  const tagPayload = encryptData(fictionalNic).split(":");
  tagPayload[3] = `${tagPayload[3].slice(0, -2)}00`;
  assert.throws(() => decryptData(tagPayload.join(":")));
});

test("rejects an incorrect encryption key", () => {
  const payload = encryptData(fictionalNic);
  process.env.ENCRYPTION_KEY = wrongKey;
  assert.throws(() => decryptData(payload));
  process.env.ENCRYPTION_KEY = testKey;
});

test("rejects missing and invalid encryption keys", () => {
  delete process.env.ENCRYPTION_KEY;
  assert.throws(() => validateEncryptionKey());
  process.env.ENCRYPTION_KEY = "not-a-key";
  assert.throws(() => validateEncryptionKey());
  process.env.ENCRYPTION_KEY = testKey;
  assert.doesNotThrow(() => validateEncryptionKey());
});

test("rejects malformed encrypted payloads", () => {
  for (const payload of [
    "",
    "plaintext",
    "v2:abcd:00:00",
    "v2:000000000000000000000000:not-hex:00000000000000000000000000000000",
    "v1:000000000000000000000000:00:00000000000000000000000000000000",
    "00000000000000000000000000000000:00000000000000000000000000000000:00:extra"
  ]) {
    assert.throws(() => decryptData(payload));
  }
});

test("decrypts legacy 16-byte-IV records", () => {
  const legacyPayload = createLegacyPayload(fictionalNic);
  assert.equal(legacyPayload.split(":")[0].length, 32);
  assert.equal(decryptData(legacyPayload), fictionalNic);
});

after(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});
