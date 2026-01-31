import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
} from "../services/auth/auth.service.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getMe(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

export default router;
