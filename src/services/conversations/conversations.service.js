import db from "../../models/index.js";
import { clampInt } from "../../utils/clampInt.js";
import { assertOrThrow } from "../../utils/errors.js";
const { Conversations, User, ContactRequests, Messages } = db;

/**
 * Get conversations for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of conversations.
 */
export async function getConversations(userId, limit = 50, offset = 0) {
  const conversations = await Conversations.findAll({
    where: {
      [db.Sequelize.Op.or]: [
        { studentUserId: userId },
        { teacherUserId: userId },
      ],
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: ContactRequests,
        as: "contactRequest",
        attributes: ["id", "status", "message"],
      },
    ],
    order: [["updatedAt", "DESC"]],
    limit,
    offset,
  });
  const conversationIds = conversations.map((conv) => conv.id);

  const messages = await Messages.findAll({
    where: {
      conversationId: { [db.Sequelize.Op.in]: conversationIds },
    },
    order: [["createdAt", "DESC"]],
  });

  const recentMessages = new Map();
  for (const message of messages) {
    if (!recentMessages.has(message.conversationId)) {
      recentMessages.set(message.conversationId, {
        id: message.id,
        senderUserId: message.senderUserId,
        content: message.content,
        createdAt: message.createdAt,
      });
    }
  }
  return {
    conversations: conversations.map((conv) => {
      const partner =
        conv.studentUserId == userId ? conv.teacher : conv.student;
      return {
        id: conv.id,
        partner: {
          id: partner.id,
          name: partner.name,
          surname: partner.surname,
          email: partner.email,
        },
        lastMessage: recentMessages.get(conv.id),
        contactRequest: conv.contactRequest,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    }),
  };
}
function normalizeContent(content) {
  return content.trim();
}
/**
 * Send message in a conversation.
 * @param {number} conversationId - The ID of the conversation.
 * @param {number} senderUserId - The ID of the sender.
 * @param {string} content - The content of the message.
 * @returns {Promise<Object>} - A promise that resolves to the created message.
 */
export async function sendMessage(conversationId, senderUserId, content) {
  const conversation = await Conversations.findByPk(conversationId, {
    include: [
      {
        model: ContactRequests,
        as: "contactRequest",
        attributes: ["status"],
      },
    ],
  });
  assertOrThrow(conversation, 404, "NOT_FOUND", "Conversation not found");
  assertOrThrow(
    senderUserId == conversation.studentUserId ||
      senderUserId == conversation.teacherUserId,
    403,
    "FORBIDDEN",
    "User is not a participant of the conversation",
  );
  assertOrThrow(
    conversation.contactRequest &&
      conversation.contactRequest.status == "ACCEPTED",
    409,
    "CONFLICT",
    "Conversation is not active",
  );
  assertOrThrow(
    typeof content === "string" && normalizeContent(content).length > 0,
    400,
    "VALIDATION_ERROR",
    "Message content cannot be empty",
  );
  assertOrThrow(
    normalizeContent(content).length <= 2000,
    400,
    "VALIDATION_ERROR",
    "Message content exceeds maximum length of 2000 characters",
  );
  const message = await Messages.create({
    conversationId,
    senderUserId,
    content: normalizeContent(content),
  });
  await Conversations.update(
    { updatedAt: new Date() },
    { where: { id: conversationId } },
  );
  return message;
}
/**
 * Get messages in a conversation.
 * @param {number} conversationId - The ID of the conversation.
 * @param {number} userId - The ID of the user requesting the messages.
 * @param {number} page - The maximum number of messages to retrieve.
 * @param {number} pageSize - The number of messages to skip.
 * @returns {Promise<Array>} - A promise that resolves to an array of messages.
 */
export async function getMessages(conversationId, userId, page, pageSize) {
  const conversation = await Conversations.findByPk(conversationId, {
    include: [
      {
        model: ContactRequests,
        as: "contactRequest",
        attributes: ["status"],
      },
    ],
  });
  assertOrThrow(conversation, 404, "NOT_FOUND", "Conversation not found");
  console.log(conversation.toJSON(), userId);
  assertOrThrow(
    userId == conversation.studentUserId ||
      userId == conversation.teacherUserId,
    403,
    "FORBIDDEN",
    "User is not a participant of the conversation",
  );
  assertOrThrow(
    conversation.contactRequest &&
      conversation.contactRequest.status == "ACCEPTED",
    409,
    "CONFLICT",
    "Conversation is not active",
  );

  page = clampInt(page, 1, 1, 10_000);
  pageSize = clampInt(pageSize, 20, 1, 50);
  const offset = (page - 1) * pageSize;

  const { rows: messages, count } = await Messages.findAndCountAll({
    where: { conversationId },
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
  });
  return {
    messages: messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderUserId: msg.senderUserId,
      content: msg.content,
      createdAt: msg.createdAt,
    })),
    page,
    pageSize,
    total: count,
  };
}
