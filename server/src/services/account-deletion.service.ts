import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

export const ACCOUNT_DELETION_CONFIRMATION = "DELETE MY ACCOUNT";

const uploadDir = path.resolve(__dirname, "../../uploads");

export function validateDeletionConfirmation(confirmation: unknown): void {
  if (confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
    throw new Error("Account deletion confirmation is invalid");
  }
}

function translationCacheKeys(text: string, sourceLanguage: string): string[] {
  return ["en", "si", "ta"]
    .filter((targetLanguage) => targetLanguage !== sourceLanguage)
    .map((targetLanguage) => {
      const hash = crypto
        .createHash("md5")
        .update(`${sourceLanguage}:${targetLanguage}:${text}`)
        .digest("hex");
      return `${sourceLanguage}_${targetLanguage}_${hash}`;
    });
}

function safeUploadPath(uploadUrl: string): string | null {
  const fileName = path.basename(uploadUrl);
  if (!fileName || fileName === "." || fileName === "..") return null;

  const filePath = path.resolve(uploadDir, fileName);
  return path.dirname(filePath) === uploadDir ? filePath : null;
}

async function removeVerificationFiles(urls: Array<string | null>): Promise<void> {
  for (const url of urls) {
    if (!url) continue;
    const filePath = safeUploadPath(url);
    if (!filePath) {
      throw new Error("Verification file path is invalid");
    }
    await fs.rm(filePath, { force: true });
  }
}

export async function deleteUserAccount(prisma: PrismaClient, userId: string): Promise<void> {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verificationRequest: {
        select: {
          id: true,
          gramaNiladhariDocUrl: true,
          businessRegDocUrl: true,
          institutionDocUrl: true
        }
      },
      jobsPosted: {
        select: {
          id: true,
          title: true,
          description: true,
          sourceLanguage: true
        }
      },
      pitches: {
        select: {
          id: true,
          title: true,
          story: true,
          sourceLanguage: true
        }
      },
      sentMessages: { select: { content: true, originalLanguage: true } },
      receivedMessages: { select: { content: true, originalLanguage: true } }
    }
  });

  if (!userData) {
    throw new Error("User not found");
  }

  await removeVerificationFiles([
    userData.verificationRequest?.gramaNiladhariDocUrl ?? null,
    userData.verificationRequest?.businessRegDocUrl ?? null,
    userData.verificationRequest?.institutionDocUrl ?? null
  ]);

  const retainedAuditTargetIds = [
    userId,
    ...(userData.verificationRequest ? [userData.verificationRequest.id] : []),
    ...userData.jobsPosted.map((job) => job.id),
    ...userData.pitches.map((pitch) => pitch.id)
  ];
  const translationKeys = [
    ...userData.jobsPosted.flatMap((job) => [
      ...translationCacheKeys(job.title, job.sourceLanguage),
      ...translationCacheKeys(job.description, job.sourceLanguage)
    ]),
    ...userData.pitches.flatMap((pitch) => [
      ...translationCacheKeys(pitch.title, pitch.sourceLanguage),
      ...translationCacheKeys(pitch.story, pitch.sourceLanguage)
    ]),
    ...[...userData.sentMessages, ...userData.receivedMessages].flatMap((message) =>
      translationCacheKeys(message.content, message.originalLanguage)
    )
  ];

  await prisma.$transaction(async (transaction) => {
    await transaction.auditLog.updateMany({
      where: {
        OR: [
          { actorId: userId },
          { targetId: { in: retainedAuditTargetIds } }
        ]
      },
      data: {
        actorId: null,
        targetId: null,
        details: null,
        ipAddress: null
      }
    });

    if (translationKeys.length > 0) {
      await transaction.translationCache.deleteMany({
        where: { cacheKey: { in: translationKeys } }
      });
    }

    await transaction.conversation.deleteMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }]
      }
    });

    await transaction.user.delete({ where: { id: userId } });
  });
}
