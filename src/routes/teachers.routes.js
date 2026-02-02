import { Router } from "express";
import {
  getMyTeacherProfile,
  editMyTeacherProfile,
  getTeacherProfile,
  editMyTeacherSubjects,
  searchTeachers,
} from "../services/teachers/teachers.service.js";
import { getTeacherReviews } from "../services/reviews/reviews.service.js";
import { getTeacherAvailability } from "../services/availability/availability.service.js";
import { getUserLessons } from "../services/lessons/lessons.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { assertOrThrow } from "../utils/index.js";
const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await getMyTeacherProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const updatedProfile = await editMyTeacherProfile(
      req.body || {},
      req.user.id,
    );
    res.status(200).json({ profile: updatedProfile });
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/me/subjects",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const { subjectIds } = req.body || {};
      assertOrThrow(
        Array.isArray(subjectIds),
        400,
        "VALIDATION_ERROR",
        "subjectIds must be an array",
      );
      const updatedProfile = await editMyTeacherSubjects(
        req.user.id,
        subjectIds,
      );
      res.status(200).json({ profile: updatedProfile });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/:userId", requireAuth, async (req, res, next) => {
  try {
    const profile = await getTeacherProfile(req.params.userId);
    res.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await searchTeachers({
      city: req.query.city,
      subjectId: req.query.subjectId ? Number(req.query.subjectId) : undefined,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.status(200).json({ ...result });
  } catch (error) {
    return next(error);
  }
});

/**
 * Get reviews for a specific teacher
 * GET /teachers/:userId/reviews
 */
router.get("/:userId/reviews", async (req, res, next) => {
  try {
    const teacherUserId = Number(req.params.userId);
    assertOrThrow(
      Number.isInteger(teacherUserId),
      400,
      "VALIDATION_ERROR",
      "Invalid teacher ID",
    );

    const result = await getTeacherReviews({
      teacherUserId,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

/**
 * Get availability slots for a specific teacher
 * GET /teachers/:userId/availability
 */
router.get("/:userId/availability", async (req, res, next) => {
  try {
    const teacherUserId = Number(req.params.userId);
    assertOrThrow(
      Number.isInteger(teacherUserId),
      400,
      "VALIDATION_ERROR",
      "Invalid teacher ID",
    );

    const dayOfWeek = req.query.dayOfWeek
      ? Number(req.query.dayOfWeek)
      : undefined;

    const slots = await getTeacherAvailability({
      teacherUserId,
      dayOfWeek,
    });

    res.status(200).json({ slots });
  } catch (error) {
    return next(error);
  }
});

/**
 * Get lessons for a specific teacher
 * GET /teachers/:userId/lessons
 */
router.get("/:userId/lessons", requireAuth, async (req, res, next) => {
  try {
    const teacherUserId = Number(req.params.userId);
    assertOrThrow(
      Number.isInteger(teacherUserId),
      400,
      "VALIDATION_ERROR",
      "Invalid teacher ID",
    );

    // Only the teacher themselves can see their lessons
    assertOrThrow(
      req.user.id === teacherUserId,
      403,
      "FORBIDDEN",
      "You can only view your own lessons",
    );

    const result = await getUserLessons({
      userId: teacherUserId,
      role: "TEACHER",
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
