import { Router } from "express";
import {
  createReview,
  getTeacherReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getStudentReviews,
} from "../services/reviews/reviews.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { assertOrThrow } from "../utils/index.js";

const router = Router();

/**
 * Create a new review
 * POST /reviews
 */
router.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const { teacherUserId, rating, comment } = req.body;

      assertOrThrow(
        teacherUserId,
        400,
        "VALIDATION_ERROR",
        "teacherUserId is required",
      );
      assertOrThrow(rating, 400, "VALIDATION_ERROR", "rating is required");

      const review = await createReview({
        teacherUserId: Number(teacherUserId),
        studentUserId: req.user.id,
        rating: Number(rating),
        comment,
      });

      res.status(201).json({ review });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Get reviews by the current student
 * GET /reviews/me
 */
router.get(
  "/me",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const result = await getStudentReviews({
        studentUserId: req.user.id,
        page: req.query.page,
        pageSize: req.query.pageSize,
      });

      res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Get reviews for a specific teacher
 * GET /reviews/teacher/:teacherUserId
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
 * Get a specific review by ID
 * GET /reviews/:reviewId
 */
router.get("/:reviewId", requireAuth, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.reviewId);
    assertOrThrow(
      Number.isInteger(reviewId),
      400,
      "VALIDATION_ERROR",
      "Invalid review ID",
    );

    const review = await getReviewById(reviewId);
    res.status(200).json({ review });
  } catch (error) {
    return next(error);
  }
});

/**
 * Update a review
 * PATCH /reviews/:reviewId
 */
router.patch(
  "/:reviewId",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const reviewId = Number(req.params.reviewId);
      assertOrThrow(
        Number.isInteger(reviewId),
        400,
        "VALIDATION_ERROR",
        "Invalid review ID",
      );

      const { rating, comment } = req.body;

      const review = await updateReview({
        reviewId,
        studentUserId: req.user.id,
        rating: rating !== undefined ? Number(rating) : undefined,
        comment,
      });

      res.status(200).json({ review });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Delete a review
 * DELETE /reviews/:reviewId
 */
router.delete(
  "/:reviewId",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const reviewId = Number(req.params.reviewId);
      assertOrThrow(
        Number.isInteger(reviewId),
        400,
        "VALIDATION_ERROR",
        "Invalid review ID",
      );

      await deleteReview(reviewId, req.user.id);
      res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
