import { socketAuth } from "./socketAuth.js";
import db from "../models/index.js";
import { sendMessage } from "../services/conversations/conversations.service.js";

export function socketSetup(io) {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        const conversation = await db.Conversations.findByPk(conversationId);
        if (!conversation)
          return socket.emit("socket:error", {
            code: 404,
            type: "NOT_FOUND",
            message: "Conversation not found",
          });
        const userId = socket.user.id;
        if (
          userId != conversation.studentUserId &&
          userId != conversation.teacherUserId
        ) {
          return socket.emit("socket:error", {
            code: 403,
            type: "FORBIDDEN",
            message: "You are not a participant of this conversation",
          });
        }
        socket.join(`conversation:${conversationId}`);
        socket.emit("conversation:joined", { conversationId });
      } catch (error) {
        socket.emit("socket:error", {
          code: 500,
          type: "SERVER_ERROR",
          message: "An error occurred while joining the conversation",
        });
      }
    });

    socket.on("message:send", async ({ conversationId, content }) => {
      try {
        if (!conversationId) {
          return socket.emit("socket:error", {
            code: 400,
            type: "VALIDATION_ERROR",
            message: "conversationId is required",
          });
        }
        if (!content) {
          return socket.emit("socket:error", {
            code: 400,
            type: "VALIDATION_ERROR",
            message: "content is required",
          });
        }
        if (!socket.rooms.has(`conversation:${conversationId}`)) {
          return socket.emit("socket:error", {
            code: 403,
            type: "FORBIDDEN",
            message: "You have not joined this conversation",
          });
        }
        const conversation = await db.Conversations.findByPk(conversationId, {
          include: [
            {
              model: db.ContactRequests,
              as: "contactRequest",
              attributes: ["status"],
            },
          ],
        });
        if (!conversation)
          return socket.emit("socket:error", {
            code: 404,
            type: "NOT_FOUND",
            message: "Conversation not found",
          });
        const userId = socket.user.id;
        if (
          userId != conversation.studentUserId &&
          userId != conversation.teacherUserId
        ) {
          return socket.emit("socket:error", {
            code: 403,
            type: "FORBIDDEN",
            message: "You are not a participant of this conversation",
          });
        }
        if (
          !conversation.contactRequest ||
          conversation.contactRequest.status !== "ACCEPTED"
        ) {
          return socket.emit("socket:error", {
            code: 403,
            type: "FORBIDDEN",
            message: "Contact request is not accepted",
          });
        }
        if (typeof content !== "string" || content.trim().length === 0) {
          return socket.emit("socket:error", {
            code: 400,
            type: "VALIDATION_ERROR",
            message: "Message content is required",
          });
        }
        if (content.trim().length > 2000) {
          return socket.emit("socket:error", {
            code: 400,
            type: "VALIDATION_ERROR",
            message:
              "Message content exceeds maximum length of 2000 characters",
          });
        }
        const message = await sendMessage(
          conversationId,
          userId,
          content.trim(),
        );
        io.to(`conversation:${conversationId}`).emit("message:new", {
          conversationId,
          message,
        });
        socket.emit("message:sent", { conversationId, messageId: message.id });
      } catch (error) {
        socket.emit("socket:error", {
          code: 500,
          type: "SERVER_ERROR",
          message: "An error occurred while sending the message",
        });
      }
    });
    socket.on("conversation:leave", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit("conversation:left", { conversationId });
    });

    socket.on("disconnect", () => {
      socket.leave(`user:${socket.user.id}`);
    });
  });
}
