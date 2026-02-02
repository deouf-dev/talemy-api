import { Router } from "express";
import {
  createLesson,
  getUserLessons,
  getLessonById,
  updateLessonStatus,
  deleteLesson,
  getUpcomingLessons,
} from "../services/lessons/lessons.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { assertOrThrow } from "../utils/index.js";

const router = Router();

/**
 * Create a new lesson
 * POST /lessons
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { teacherUserId, studentUserId, subjectId, startAt, durationMin } =
      req.body;

    assertOrThrow(
      teacherUserId,
      400,
      "VALIDATION_ERROR",
      "teacherUserId is required",
    );
    assertOrThrow(
      studentUserId,
      400,
      "VALIDATION_ERROR",
      "studentUserId is required",
    );
    assertOrThrow(subjectId, 400, "VALIDATION_ERROR", "subjectId is required");
    assertOrThrow(startAt, 400, "VALIDATION_ERROR", "startAt is required");
    assertOrThrow(
      durationMin,
      400,
      "VALIDATION_ERROR",
      "durationMin is required",
    );

    // Verify that the requesting user is either the teacher or the student
    assertOrThrow(
      req.user.id === teacherUserId || req.user.id === studentUserId,
      403,
      "FORBIDDEN",
      "You can only create lessons for yourself",
    );

    const lesson = await createLesson({
      teacherUserId,
      studentUserId,
      subjectId,
      startAt,
      durationMin: Number(durationMin),
    });

    res.status(201).json({ lesson });
  } catch (error) {
    return next(error);
  }
});

/**
 * Get my lessons
 * GET /lessons/me
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await getUserLessons({
      userId: req.user.id,
      role: req.user.role,
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

/**
 * Get upcoming lessons
 * GET /lessons/upcoming
 */
router.get("/upcoming", requireAuth, async (req, res, next) => {
  try {
    const lessons = await getUpcomingLessons({
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(200).json({ lessons });
  } catch (error) {
    return next(error);
  }
});

/**
 * Get a specific lesson by ID
 * GET /lessons/:lessonId
 */
router.get("/:lessonId", requireAuth, async (req, res, next) => {
  try {
    const lessonId = Number(req.params.lessonId);
    assertOrThrow(
      Number.isInteger(lessonId),
      400,
      "VALIDATION_ERROR",
      "Invalid lesson ID",
    );

    const lesson = await getLessonById(lessonId, req.user.id);
    res.status(200).json({ lesson });
  } catch (error) {
    return next(error);
  }
});

/**
 * Update lesson status
 * PATCH /lessons/:lessonId/status
 */
router.patch("/:lessonId/status", requireAuth, async (req, res, next) => {
  try {
    const lessonId = Number(req.params.lessonId);
    assertOrThrow(
      Number.isInteger(lessonId),
      400,
      "VALIDATION_ERROR",
      "Invalid lesson ID",
    );

    const { status } = req.body;
    assertOrThrow(status, 400, "VALIDATION_ERROR", "status is required");

    const lesson = await updateLessonStatus({
      lessonId,
      userId: req.user.id,
      status,
    });

    res.status(200).json({ lesson });
  } catch (error) {
    return next(error);
  }
});

/**
 * Delete a lesson
 * DELETE /lessons/:lessonId
 */
router.delete("/:lessonId", requireAuth, async (req, res, next) => {
  try {
    const lessonId = Number(req.params.lessonId);
    assertOrThrow(
      Number.isInteger(lessonId),
      400,
      "VALIDATION_ERROR",
      "Invalid lesson ID",
    );

    await deleteLesson(lessonId, req.user.id);
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
