import db from "../../models/index.js";
import { assertOrThrow, clampInt } from "../../utils/index.js";
import { Op } from "sequelize";

const { Lessons, User, Subjects } = db;

/**
 * Create a new lesson
 * @param {{teacherUserId: number, studentUserId: number, subjectId: number, startAt: Date|string, durationMin: number}} payload
 * @returns {Promise<{id: number, teacherUserId: number, studentUserId: number, subjectId: number, startAt: Date, durationMin: number, statusForStudent: string, statusForTeacher: string, createdAt: Date, updatedAt: Date}>}
 */
export async function createLesson(payload) {
  const { teacherUserId, studentUserId, subjectId, startAt, durationMin } =
    payload;

  assertOrThrow(
    teacherUserId !== studentUserId,
    400,
    "VALIDATION_ERROR",
    "Teacher and student IDs must be different",
  );

  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  const student = await User.findByPk(studentUserId);
  assertOrThrow(student, 404, "NOT_FOUND", "Student not found");

  const subject = await Subjects.findByPk(subjectId);
  assertOrThrow(subject, 404, "NOT_FOUND", "Subject not found");

  assertOrThrow(
    Number.isInteger(durationMin) && durationMin > 0,
    400,
    "VALIDATION_ERROR",
    "Duration must be a positive integer",
  );

  const startDate = new Date(startAt);
  assertOrThrow(
    startDate > new Date(),
    400,
    "VALIDATION_ERROR",
    "Start time must be in the future",
  );

  const lesson = await Lessons.create({
    teacherUserId,
    studentUserId,
    subjectId,
    startAt: startDate,
    durationMin,
    statusForStudent: "PENDING",
    statusForTeacher: "PENDING",
  });

  return lesson;
}

/**
 * Get lessons for a user (teacher or student)
 * @param {{userId: number, role: string, status?: string, page?: number, pageSize?: number}} params
 * @returns {Promise<{items: Array, page: number, pageSize: number, total: number}>}
 */
export async function getUserLessons({ userId, role, status, page, pageSize }) {
  const whereClause = {};

  if (role === "TEACHER") {
    whereClause.teacherUserId = userId;
  } else if (role === "STUDENT") {
    whereClause.studentUserId = userId;
  } else {
    throw new Error("Invalid role");
  }

  if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
    const key = role === "TEACHER" ? "statusForTeacher" : "statusForStudent";
    whereClause[key] = status;
  }

  const pageNum = clampInt(page, 1, 1, 10_000);
  const pageSizeNum = clampInt(pageSize, 20, 1, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const { rows, count } = await Lessons.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: Subjects,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
    limit: pageSizeNum,
    offset,
    order: [["startAt", "DESC"]],
  });

  return {
    items: rows,
    page: pageNum,
    pageSize: pageSizeNum,
    total: count,
  };
}

/**
 * Get a lesson by ID
 * @param {number} lessonId
 * @param {number} userId - The user requesting the lesson
 * @returns {Promise<Object>}
 */
export async function getLessonById(lessonId, userId) {
  const lesson = await Lessons.findByPk(lessonId, {
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: Subjects,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
  });

  assertOrThrow(lesson, 404, "NOT_FOUND", "Lesson not found");

  assertOrThrow(
    lesson.teacherUserId === userId || lesson.studentUserId === userId,
    403,
    "FORBIDDEN",
    "You do not have access to this lesson",
  );

  return lesson;
}

/**
 * Update lesson status
 * @param {{lessonId: number, userId: number, status: string}} params
 * @returns {Promise<Object>}
 */
export async function updateLessonStatus({ lessonId, userId, status }) {
  assertOrThrow(
    ["PENDING", "CONFIRMED", "CANCELLED"].includes(status),
    400,
    "VALIDATION_ERROR",
    "Invalid status",
  );

  const lesson = await Lessons.findByPk(lessonId);
  assertOrThrow(lesson, 404, "NOT_FOUND", "Lesson not found");

  assertOrThrow(
    lesson.teacherUserId === userId || lesson.studentUserId === userId,
    403,
    "FORBIDDEN",
    "You do not have permission to update this lesson",
  );
  const key =
    lesson.teacherUserId === userId ? "statusForTeacher" : "statusForStudent";
  await lesson.update({ [key]: status });

  const updatedLesson = await Lessons.findByPk(lessonId, {
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: Subjects,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
  });

  return updatedLesson;
}

/**
 * Delete a lesson
 * @param {number} lessonId
 * @param {number} userId
 * @returns {Promise<void>}
 */
export async function deleteLesson(lessonId, userId) {
  const lesson = await Lessons.findByPk(lessonId);
  assertOrThrow(lesson, 404, "NOT_FOUND", "Lesson not found");

  assertOrThrow(
    lesson.teacherUserId === userId || lesson.studentUserId === userId,
    403,
    "FORBIDDEN",
    "You do not have permission to delete this lesson",
  );

  await lesson.destroy();
}

/**
 * Get upcoming lessons for a user
 * @param {{userId: number, role: string}} params
 * @returns {Promise<Array>}
 */
export async function getUpcomingLessons({ userId, role }) {
  const whereClause = {
    startAt: { [Op.gte]: new Date() },
  };

  if (role === "TEACHER") {
    whereClause.teacherUserId = userId;
    whereClause.statusForTeacher = { [Op.in]: ["PENDING", "CONFIRMED"] };
  } else if (role === "STUDENT") {
    whereClause.studentUserId = userId;
    whereClause.statusForStudent = { [Op.in]: ["PENDING", "CONFIRMED"] };
  } else {
    throw new Error("Invalid role");
  }

  const lessons = await Lessons.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname", "email"],
      },
      {
        model: Subjects,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
    order: [["startAt", "ASC"]],
    limit: 10,
  });

  return lessons;
}
