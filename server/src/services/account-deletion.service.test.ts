import assert from "node:assert/strict";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  deleteUserAccount,
  validateDeletionConfirmation
} from "./account-deletion.service";

test("requires the exact final deletion confirmation", () => {
  assert.doesNotThrow(() => validateDeletionConfirmation(ACCOUNT_DELETION_CONFIRMATION));
  assert.throws(() => validateDeletionConfirmation("delete my account"));
  assert.throws(() => validateDeletionConfirmation(""));
});

test("rejects deletion when the authenticated user no longer exists", async () => {
  let transactionCalled = false;
  const prisma = {
    user: { findUnique: async () => null },
    $transaction: async () => { transactionCalled = true; }
  } as unknown as PrismaClient;

  await assert.rejects(() => deleteUserAccount(prisma, "missing-user"), /User not found/);
  assert.equal(transactionCalled, false);
});

test("anonymizes affected audit data and deletes the user transactionally", async () => {
  const calls: string[] = [];
  const transaction = {
    auditLog: {
      updateMany: async (args: unknown) => {
        calls.push("auditLog.updateMany");
        assert.ok(args);
      }
    },
    translationCache: {
      deleteMany: async (args: unknown) => {
        calls.push("translationCache.deleteMany");
        assert.ok(args);
      }
    },
    conversation: {
      deleteMany: async (args: unknown) => {
        calls.push("conversation.deleteMany");
        assert.ok(args);
      }
    },
    user: {
      delete: async (args: unknown) => {
        calls.push("user.delete");
        assert.deepEqual(args, { where: { id: "user-1" } });
      }
    }
  };
  const prisma = {
    user: {
      findUnique: async () => ({
        verificationRequest: null,
        jobsPosted: [{ id: "job-1", title: "Fictional job", description: "Fictional description", sourceLanguage: "en" }],
        pitches: [],
        sentMessages: [],
        receivedMessages: []
      })
    },
    $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction)
  } as unknown as PrismaClient;

  await deleteUserAccount(prisma, "user-1");
  assert.deepEqual(calls, [
    "auditLog.updateMany",
    "translationCache.deleteMany",
    "conversation.deleteMany",
    "user.delete"
  ]);
});
