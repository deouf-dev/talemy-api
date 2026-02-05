import db from "../../models/index.js";
import { assertOrThrow } from "../../utils/index.js";
import { io } from "../../server.js";
const { ContactRequests, User, Conversations } = db;

/**
 * @private
 * @param {string} message
 * @returns {string}
 */
function normaliseMessage(message) {
  return String(message).trim();
}
/**
 * Create a contact request from a student to a teacher
 * @param {string|number} studentUserId
 * @param {string|number} teacherUserId
 * @param {string} message
 * @returns {Promise<{id: string|number, studentUserId: string|number, teacherUserId: string|number, status: string, message: string, createdAt: Date, updatedAt: Date}>}
 */
export async function createContactRequest(payload) {
  const { studentUserId, teacherUserId, message } = payload;
  assertOrThrow(
    studentUserId !== teacherUserId,
    400,
    "VALIDATION_ERROR",
    "Student and teacher IDs must be different",
  );
  assertOrThrow(
    studentUserId,
    400,
    "VALIDATION_ERROR",
    "Student user ID is required",
  );
  assertOrThrow(
    teacherUserId,
    400,
    "VALIDATION_ERROR",
    "Teacher user ID is required",
  );
  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(teacher, 404, "NOT_FOUND", "Teacher not found");
  const requestExists = await ContactRequests.findOne({
    where: {
      studentUserId,
      teacherUserId,
      status: "PENDING",
    },
  });
  assertOrThrow(
    !requestExists,
    409,
    "CONFLICT",
    "A pending contact request already exists",
  );
  try {
    const contactRequest = await ContactRequests.create({
      studentUserId,
      teacherUserId,
      message: normaliseMessage(message),
    });

    const requestWithDetails = await ContactRequests.findByPk(
      contactRequest.id,
      {
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "name", "surname", "email"],
          },
        ],
      },
    );

    if (io) {
      io.to(`user:${teacherUserId}`).emit("contactRequest:created", {
        contactRequest: requestWithDetails,
      });
      io.to(`user:${studentUserId}`).emit("contactRequest:created", {
        contactRequest: requestWithDetails,
      });
    }

    return contactRequest;
  } catch (error) {
    throw error;
  }
}
/**
 * Get my contact requests
 * @param {{userId: number, role: "STUDENT" | "TEACHER" | "ADMIN", filterStatus?: "PENDING" | "ACCEPTED" | "REJECTED"}} param
 * @returns {Promise<Array<{id: number, studentUserId: number, teacherUserId: number, status: string, message: string, createdAt: Date, updatedAt: Date}>>}
 */
export async function getMyContactRequests({ userId, role, filterStatus }) {
  let whereClause = {};
  if (role === "STUDENT") {
    whereClause.studentUserId = userId;
  } else if (role === "TEACHER") {
    whereClause.teacherUserId = userId;
  } else {
    throw new Error("Invalid role for fetching contact requests");
  }
  const contactRequests = await ContactRequests.findAll({
    where: {
      ...whereClause,
      ...(filterStatus ? { status: filterStatus } : {}),
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return contactRequests.map((request) => ({
    id: request.id,
    studentUserId: request.studentUserId,
    teacherUserId: request.teacherUserId,
    student: request.student,
    status: request.status,
    message: request.message,
  }));
}
/** Update contact request status
 * @param {number} requestId
 * @param {number} userId
 * @param {"PENDING" | "ACCEPTED" | "REJECTED"} newStatus
 * @returns {Promise<{id: number, studentUserId: number, teacherUserId: number, status: string, message: string, createdAt: Date, updatedAt: Date}>}
 */
export async function updateContactRequestStatus(requestId, userId, newStatus) {
  const contactRequest = await ContactRequests.findByPk(requestId);
  assertOrThrow(contactRequest, 404, "NOT_FOUND", "Contact request not found");
  assertOrThrow(
    ["PENDING", "ACCEPTED", "REJECTED"].includes(newStatus),
    400,
    "VALIDATION_ERROR",
    "Invalid status value",
  );
  assertOrThrow(
    userId == contactRequest.teacherUserId,
    403,
    "FORBIDDEN",
    "You are not authorized to update this contact request",
  );
  console.log(contactRequest.toJSON());
  contactRequest.status = newStatus;
  await contactRequest.save();

  let conversation = null;
  if (newStatus === "ACCEPTED") {
    conversation = await Conversations.create({
      studentUserId: contactRequest.studentUserId,
      teacherUserId: contactRequest.teacherUserId,
      requestId: contactRequest.id,
    });
  }

  const requestWithDetails = await ContactRequests.findByPk(contactRequest.id, {
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
    ],
  });

  if (io) {
    io.to(`user:${contactRequest.teacherUserId}`).emit(
      "contactRequest:statusUpdated",
      {
        contactRequest: requestWithDetails,
        conversation: conversation,
      },
    );
    io.to(`user:${contactRequest.studentUserId}`).emit(
      "contactRequest:statusUpdated",
      {
        contactRequest: requestWithDetails,
        conversation: conversation,
      },
    );
  }

  return {
    id: contactRequest.id,
    studentUserId: contactRequest.studentUserId,
    teacherUserId: contactRequest.teacherUserId,
    status: contactRequest.status,
    message: contactRequest.message,
  };
}
