import { Router } from "express";
import {
  createAvailabilitySlot,
  getTeacherAvailability,
  getMyAvailability,
  getAvailabilitySlotById,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  deleteAllAvailabilitySlots,
} from "../services/availability/availability.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { assertOrThrow } from "../utils/index.js";

const router = Router();

/**
 * Create a new availability slot
 * POST /availability
 */
router.post(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const { dayOfWeek, startTime, endTime } = req.body;

      assertOrThrow(
        dayOfWeek !== undefined,
        400,
        "VALIDATION_ERROR",
        "dayOfWeek is required",
      );
      assertOrThrow(
        startTime,
        400,
        "VALIDATION_ERROR",
        "startTime is required",
      );
      assertOrThrow(endTime, 400, "VALIDATION_ERROR", "endTime is required");

      const slot = await createAvailabilitySlot({
        teacherUserId: req.user.id,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      });

      res.status(201).json({ slot });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Get my availability slots (for authenticated teacher)
 * GET /availability/me
 */
router.get(
  "/me",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const slots = await getMyAvailability(req.user.id);
      res.status(200).json({ slots });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Get availability slots for a specific teacher
 * GET /availability/teacher/:teacherUserId
 */
router.get("/teacher/:teacherUserId", async (req, res, next) => {
  try {
    const teacherUserId = Number(req.params.teacherUserId);
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
 * Get a specific availability slot by ID
 * GET /availability/:slotId
 */
router.get(
  "/:slotId",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const slotId = Number(req.params.slotId);
      assertOrThrow(
        Number.isInteger(slotId),
        400,
        "VALIDATION_ERROR",
        "Invalid slot ID",
      );

      const slot = await getAvailabilitySlotById(slotId, req.user.id);
      res.status(200).json({ slot });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Update an availability slot
 * PATCH /availability/:slotId
 */
router.patch(
  "/:slotId",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const slotId = Number(req.params.slotId);
      assertOrThrow(
        Number.isInteger(slotId),
        400,
        "VALIDATION_ERROR",
        "Invalid slot ID",
      );

      const { dayOfWeek, startAt, endAt } = req.body;

      const slot = await updateAvailabilitySlot({
        slotId,
        teacherUserId: req.user.id,
        dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
        startAt,
        endAt,
      });

      res.status(200).json({ slot });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Delete an availability slot
 * DELETE /availability/:slotId
 */
router.delete(
  "/:slotId",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const slotId = Number(req.params.slotId);
      assertOrThrow(
        Number.isInteger(slotId),
        400,
        "VALIDATION_ERROR",
        "Invalid slot ID",
      );

      await deleteAvailabilitySlot(slotId, req.user.id);
      res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Delete all availability slots for the authenticated teacher
 * DELETE /availability
 */
router.delete(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const deletedCount = await deleteAllAvailabilitySlots(req.user.id);
      res.status(200).json({ deletedCount });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
