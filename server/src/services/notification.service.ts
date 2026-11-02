import { PrismaClient } from "@prisma/client";

export async function createNotification(
  prisma: PrismaClient,
  params: {
    userId: string;
    type: "VERIFICATION" | "APPLICATION" | "MESSAGE" | "PLEDGE" | "SYSTEM";
    title: string;
    message: string;
    link?: string;
  }
) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null
      }
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}

