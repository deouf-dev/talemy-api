import { Router } from "express";
import {
  getMyTeacherProfile,
  editMyTeacherProfile,
  getTeacherProfile,
  editMyTeacherSubjects,
  searchTeachers,
} from "../services/teachers/teachers.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { assertOrThrow } from "../utils/errors.js";
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

export default router;
