import { Router } from "express";
import {
  getConversations,
  sendMessage,
  getMessages,
} from "../services/conversations/conversations.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { assertOrThrow } from "../utils/errors.js";
const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
  try {
    const result = await getConversations(req.user.id, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:conversationId/messages",
  requireAuth,
  async (req, res, next) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    assertOrThrow(
      Number.isInteger(parseInt(conversationId, 10)),
      400,
      "VALIDATION_ERROR",
      "Invalid conversation ID",
    );
    assertOrThrow(
      typeof content === "string" && content.trim().length > 0,
      400,
      "VALIDATION_ERROR",
      "Message content is required",
    );
    try {
      const message = await sendMessage(conversationId, req.user.id, content);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:conversationId/messages", requireAuth, async (req, res, next) => {
  const { conversationId } = req.params;
  assertOrThrow(
    Number.isInteger(parseInt(conversationId, 10)),
    400,
    "VALIDATION_ERROR",
    "Invalid conversation ID",
  );
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
    const messages = await getMessages(
      conversationId,
      req.user.id,
      page,
      pageSize,
    );
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;
