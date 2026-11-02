import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { translateWithCache } from "../services/translation.service";
import { createNotification } from "../services/notification.service";

const router = Router();
const prisma = new PrismaClient();

// GET /api/messages/conversations - List user conversations
router.get("/conversations", authenticateToken, async (req: Request, res: Response) => {
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
            isVerified: true,
            roles: { select: { role: true } },
            employerProfile: { select: { companyName: true } }
          }
        });

        const lastMsg = conv.messages[0] || null;
        let translatedLastMsg = lastMsg?.content;

        if (lastMsg && lastMsg.originalLanguage !== req.user!.preferredLanguage) {
          const trans = await translateWithCache(
            prisma,
            lastMsg.content,
            lastMsg.originalLanguage,
            req.user!.preferredLanguage
          );
          translatedLastMsg = trans.text;
        }

        return {
          id: conv.id,
          type: conv.type,
          referenceId: conv.referenceId,
          otherUser: {
            id: otherUser?.id,
            fullName: otherUser?.fullName || "User",
            companyName: otherUser?.employerProfile?.companyName,
            isVerified: otherUser?.isVerified,
            roles: otherUser?.roles.map((r) => r.role)
          },
          lastMessage: lastMsg
            ? {
                ...lastMsg,
                translatedContent: translatedLastMsg
              }
            : null,
          updatedAt: conv.updatedAt
        };
      })
    );

    return res.json({ conversations: populated });
  } catch (err) {
    console.error("Fetch conversations error:", err);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// POST /api/messages/conversations - Start or find conversation
router.post("/conversations", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { recipientId, type = "DIRECT", referenceId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (recipientId === req.user!.id) {
      return res.status(400).json({ error: "You cannot start a conversation with yourself" });
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
    });

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
router.get("/conversations/:id", authenticateToken, async (req: Request, res: Response) => {
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
        isVerified: true,
        employerProfile: { select: { companyName: true } }
      }
    });

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
          isTranslated = true;
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
router.post("/conversations/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, sourceLanguage = req.user!.preferredLanguage || "en" } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conv.participant1Id !== req.user!.id && conv.participant2Id !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const receiverId = conv.participant1Id === req.user!.id ? conv.participant2Id : conv.participant1Id;

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

