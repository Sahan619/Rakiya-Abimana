import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { detectSourceLanguage, translateWithCache } from "../services/translation.service";
import { createNotification } from "../services/notification.service";
import { chatPairAllows } from "../config/permissions";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken, requirePermission("chat:use"));

async function isConversationAllowed(
  participant1Id: string,
  participant1Roles: readonly Role[],
  participant2Id: string,
  participant2Roles: readonly Role[],
  type: string,
  referenceId: string | null
): Promise<boolean> {
  if (!chatPairAllows(participant1Roles, participant2Roles, type) || !referenceId) {
    return false;
  }

  let contextOwnerId: string | null = null;
  if (type === "JOB_APPLICATION") {
    const job = await prisma.job.findUnique({
      where: { id: referenceId },
      select: { employerId: true }
    });
    contextOwnerId = job?.employerId ?? null;
  } else if (type === "PITCH_INTEREST") {
    const pitch = await prisma.pitch.findUnique({
      where: { id: referenceId },
      select: { entrepreneurId: true }
    });
    contextOwnerId = pitch?.entrepreneurId ?? null;
  } else if (type === "FUNDER_DIRECTORY") {
    const funderId = participant1Roles.includes(Role.Funder)
      ? participant1Id
      : participant2Roles.includes(Role.Funder)
        ? participant2Id
        : null;
    const hasEntrepreneur = participant1Roles.includes(Role.Entrepreneur) ||
      participant2Roles.includes(Role.Entrepreneur);
    return hasEntrepreneur && funderId === referenceId;
  }

  return contextOwnerId === participant1Id || contextOwnerId === participant2Id;
}

// GET /api/messages/conversations - List user conversations
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }]
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Populate other participant details
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            fullName: true,
            isActive: true,
            isVerified: true,
            roles: { select: { role: true } },
            employerProfile: { select: { companyName: true } }
          }
        });

        if (
          !otherUser?.isActive ||
          !(await isConversationAllowed(
            userId,
            req.user!.roles,
            otherUserId,
            otherUser.roles.map((role) => role.role),
            conv.type,
            conv.referenceId
          ))
        ) {
          return { allowed: false as const, conversation: null };
        }

        const lastMsg = conv.messages[0] || null;
        let translatedLastMsg = lastMsg?.content;
        let isLastMessageMachineTranslated = false;

        if (lastMsg && lastMsg.originalLanguage !== req.user!.preferredLanguage) {
          const trans = await translateWithCache(
            prisma,
            lastMsg.content,
            lastMsg.originalLanguage,
            req.user!.preferredLanguage
          );
          translatedLastMsg = trans.text;
          isLastMessageMachineTranslated = trans.isMachineTranslated;
        }

        return {
          allowed: true as const,
          conversation: {
            id: conv.id,
            type: conv.type,
            referenceId: conv.referenceId,
            otherUser: {
              id: otherUser.id,
              fullName: otherUser.fullName || "User",
              companyName: otherUser.employerProfile?.companyName,
              isVerified: otherUser.isVerified,
              roles: otherUser.roles.map((r) => r.role)
            },
            lastMessage: lastMsg
              ? {
                  ...lastMsg,
                  translatedContent: translatedLastMsg,
                  isMachineTranslated: isLastMessageMachineTranslated
                }
              : null,
            updatedAt: conv.updatedAt
          },
        };
      })
    );

    return res.json({
      conversations: populated.flatMap((entry) => entry.allowed ? [entry.conversation] : [])
    });
  } catch (err) {
    console.error("Fetch conversations error:", err);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// POST /api/messages/conversations - Start or find conversation
router.post(
  "/conversations",
  (req: Request, res: Response, next) => {
    if (req.body?.type !== "FUNDER_DIRECTORY") {
      return next();
    }
    return requirePermission("funder:contact")(req, res, next);
  },
  async (req: Request, res: Response) => {
  try {
    const { recipientId, type, referenceId } = req.body;

    if (typeof recipientId !== "string" || !recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (recipientId === req.user!.id) {
      return res.status(400).json({ error: "You cannot start a conversation with yourself" });
    }

    if (typeof type !== "string" || typeof referenceId !== "string" || !referenceId) {
      return res.status(400).json({ error: "A conversation type and context are required" });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        isActive: true,
        isVerified: true,
        funderProfile: { select: { listedInDirectory: true } },
        roles: { select: { role: true } }
      }
    });

    if (!recipient?.isActive) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    if (
      type === "FUNDER_DIRECTORY" &&
      (
        !req.user!.roles.includes(Role.Entrepreneur) ||
        !recipient.roles.some((role) => role.role === Role.Funder) ||
        !recipient.isVerified ||
        !recipient.funderProfile?.listedInDirectory ||
        referenceId !== recipientId
      )
    ) {
      return res.status(403).json({ error: "Funder is not available in the directory." });
    }

    if (
      !(await isConversationAllowed(
        req.user!.id,
        req.user!.roles,
        recipientId,
        recipient.roles.map((role) => role.role),
        type,
        referenceId
      ))
    ) {
      return res.status(403).json({ error: "Conversation not allowed for these roles and context" });
    }

    // Check if conversation already exists between these 2 users for this context
    let conv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: req.user!.id, participant2Id: recipientId },
          { participant1Id: recipientId, participant2Id: req.user!.id }
        ],
        type,
        referenceId: referenceId || null
      }
      }
    );

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          participant1Id: req.user!.id,
          participant2Id: recipientId,
          type,
          referenceId: referenceId || null
        }
      });
    }

    return res.json({ conversation: conv });
  } catch (err) {
    return res.status(500).json({ error: "Failed to initialize conversation" });
  }
});

// GET /api/messages/conversations/:id - Messages with automatic reader translation
router.get("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const readerLang = req.user!.preferredLanguage || "en";

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        isVerified: true,
        roles: { select: { role: true } },
        employerProfile: { select: { companyName: true } }
      }
    });

    if (
      !otherUser?.isActive ||
      !(await isConversationAllowed(
        userId,
        req.user!.roles,
        otherUserId,
        otherUser.roles.map((role) => role.role),
        conv.type,
        conv.referenceId
      ))
    ) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    // Translate each message into reader's language
    const enrichedMessages = await Promise.all(
      conv.messages.map(async (msg) => {
        let translatedText = msg.content;
        let isTranslated = false;

        if (msg.originalLanguage !== readerLang) {
          const trans = await translateWithCache(
            prisma,
            msg.content,
            msg.originalLanguage,
            readerLang
          );
          translatedText = trans.text;
          isTranslated = trans.isMachineTranslated;
        }

        return {
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          originalContent: msg.content,
          translatedContent: translatedText,
          originalLanguage: msg.originalLanguage,
          isMachineTranslated: isTranslated,
          createdAt: msg.createdAt
        };
      })
    );

    return res.json({
      conversation: {
        id: conv.id,
        type: conv.type,
        referenceId: conv.referenceId,
        otherUser
      },
      messages: enrichedMessages
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/messages/conversations/:id - Send message
router.post("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      content,
      sourceLanguage: preferredSourceLanguage = req.user!.preferredLanguage || "en"
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }
    const sourceLanguage = detectSourceLanguage(content, preferredSourceLanguage);

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conv.participant1Id !== req.user!.id && conv.participant2Id !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const receiverId = conv.participant1Id === req.user!.id ? conv.participant2Id : conv.participant1Id;
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        isActive: true,
        roles: { select: { role: true } }
      }
    });

    if (
      !receiver?.isActive ||
      !(await isConversationAllowed(
        req.user!.id,
        req.user!.roles,
        receiverId,
        receiver.roles.map((role) => role.role),
        conv.type,
        conv.referenceId
      ))
    ) {
      return res.status(403).json({ error: "Messaging is not allowed for this conversation" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: req.user!.id,
        receiverId,
        content: content.trim(),
        originalLanguage: sourceLanguage
      }
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Notify receiver
    await createNotification(prisma, {
      userId: receiverId,
      type: "MESSAGE",
      title: "New Message",
      message: `${req.user!.fullName}: ${content.trim().slice(0, 50)}...`,
      link: `/inbox/${id}`
    });

    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
