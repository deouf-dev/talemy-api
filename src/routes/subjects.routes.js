import { Router } from "express";
import { getAllSubjects } from "../services/subjects/subjects.service.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const subjects = await getAllSubjects();
    res.status(200).json({ subjects });
  } catch (error) {
    return next(error);
  }
});

export default router;
