import { Router } from "express";
import {
  getMyStudentProfile,
  editMyStudentProfile,
  getStudentProfile,
} from "../services/students/students.service.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await getMyStudentProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const updatedProfile = await editMyStudentProfile(req.body, req.user.id);
    res.status(200).json({ profile: updatedProfile });
  } catch (error) {
    return next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  try {
    const profile = await getStudentProfile(req.params.userId);
    res.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
});

export default router;
