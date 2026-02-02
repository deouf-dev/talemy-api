import db from "../../models/index.js";
import { assertOrThrow, clampInt } from "../../utils/index.js";
import { Op } from "sequelize";

const { Reviews, User, TeacherProfiles } = db;

/**
 * Create a new review
 * @param {{teacherUserId: number, studentUserId: number, rating: number, comment?: string}} payload
 * @returns {Promise<Object>}
 */
export async function createReview(payload) {
  const { teacherUserId, studentUserId, rating, comment } = payload;

  assertOrThrow(
    teacherUserId !== studentUserId,
    400,
    "VALIDATION_ERROR",
    "Teacher and student IDs must be different",
  );

  // Verify teacher exists and has the right role
  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  // Verify student exists
  const student = await User.findByPk(studentUserId);
  assertOrThrow(student, 404, "NOT_FOUND", "Student not found");

  // Validate rating
  assertOrThrow(
    Number.isInteger(rating) && rating >= 1 && rating <= 5,
    400,
    "VALIDATION_ERROR",
    "Rating must be an integer between 1 and 5",
  );

  // Check if review already exists
  const existingReview = await Reviews.findOne({
    where: {
      teacherUserId,
      studentUserId,
    },
  });

  assertOrThrow(
    !existingReview,
    409,
    "CONFLICT",
    "You have already reviewed this teacher",
  );

  // Validate comment if provided
  let normalizedComment = null;
  if (comment !== undefined && comment !== null) {
    normalizedComment = String(comment).trim();
    assertOrThrow(
      normalizedComment.length <= 1000,
      400,
      "VALIDATION_ERROR",
      "Comment must be at most 1000 characters long",
    );
  }

  const review = await Reviews.create({
    teacherUserId,
    studentUserId,
    rating,
    comment: normalizedComment || null,
  });

  // Update teacher's rating average
  await updateTeacherRating(teacherUserId);

  return review;
}

/**
 * Get reviews for a teacher
 * @param {{teacherUserId: number, page?: number, pageSize?: number}} params
 * @returns {Promise<{items: Array, page: number, pageSize: number, total: number}>}
 */
export async function getTeacherReviews({ teacherUserId, page, pageSize }) {
  // Verify teacher exists
  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  const pageNum = clampInt(page, 1, 1, 10_000);
  const pageSizeNum = clampInt(pageSize, 20, 1, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const { rows, count } = await Reviews.findAndCountAll({
    where: { teacherUserId },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname"],
      },
    ],
    limit: pageSizeNum,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    items: rows,
    page: pageNum,
    pageSize: pageSizeNum,
    total: count,
  };
}

/**
 * Get a single review by ID
 * @param {number} reviewId
 * @returns {Promise<Object>}
 */
export async function getReviewById(reviewId) {
  const review = await Reviews.findByPk(reviewId, {
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname"],
      },
    ],
  });

  assertOrThrow(review, 404, "NOT_FOUND", "Review not found");

  return review;
}

/**
 * Update a review
 * @param {{reviewId: number, studentUserId: number, rating?: number, comment?: string}} params
 * @returns {Promise<Object>}
 */
export async function updateReview({
  reviewId,
  studentUserId,
  rating,
  comment,
}) {
  const review = await Reviews.findByPk(reviewId);
  assertOrThrow(review, 404, "NOT_FOUND", "Review not found");

  // Only the student who created the review can update it
  assertOrThrow(
    review.studentUserId === studentUserId,
    403,
    "FORBIDDEN",
    "You do not have permission to update this review",
  );

  const updates = {};

  if (rating !== undefined) {
    assertOrThrow(
      Number.isInteger(rating) && rating >= 1 && rating <= 5,
      400,
      "VALIDATION_ERROR",
      "Rating must be an integer between 1 and 5",
    );
    updates.rating = rating;
  }

  if (comment !== undefined) {
    if (comment === null || comment === "") {
      updates.comment = null;
    } else {
      const normalizedComment = String(comment).trim();
      assertOrThrow(
        normalizedComment.length <= 1000,
        400,
        "VALIDATION_ERROR",
        "Comment must be at most 1000 characters long",
      );
      updates.comment = normalizedComment;
    }
  }

  assertOrThrow(
    Object.keys(updates).length > 0,
    400,
    "VALIDATION_ERROR",
    "At least one field must be provided",
  );

  await review.update(updates);

  // Update teacher's rating average if rating changed
  if (rating !== undefined) {
    await updateTeacherRating(review.teacherUserId);
  }

  const updatedReview = await Reviews.findByPk(reviewId, {
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "name", "surname"],
      },
    ],
  });

  return updatedReview;
}

/**
 * Delete a review
 * @param {number} reviewId
 * @param {number} studentUserId
 * @returns {Promise<void>}
 */
export async function deleteReview(reviewId, studentUserId) {
  const review = await Reviews.findByPk(reviewId);
  assertOrThrow(review, 404, "NOT_FOUND", "Review not found");

  // Only the student who created the review can delete it
  assertOrThrow(
    review.studentUserId === studentUserId,
    403,
    "FORBIDDEN",
    "You do not have permission to delete this review",
  );

  const teacherUserId = review.teacherUserId;
  await review.destroy();

  // Update teacher's rating average
  await updateTeacherRating(teacherUserId);
}

/**
 * Get reviews by a student
 * @param {{studentUserId: number, page?: number, pageSize?: number}} params
 * @returns {Promise<{items: Array, page: number, pageSize: number, total: number}>}
 */
export async function getStudentReviews({ studentUserId, page, pageSize }) {
  const pageNum = clampInt(page, 1, 1, 10_000);
  const pageSizeNum = clampInt(pageSize, 20, 1, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const { rows, count } = await Reviews.findAndCountAll({
    where: { studentUserId },
    include: [
      {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "surname"],
      },
    ],
    limit: pageSizeNum,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    items: rows,
    page: pageNum,
    pageSize: pageSizeNum,
    total: count,
  };
}

/**
 * Update teacher's rating average and reviews count
 * @private
 * @param {number} teacherUserId
 * @returns {Promise<void>}
 */
async function updateTeacherRating(teacherUserId) {
  const reviews = await Reviews.findAll({
    where: { teacherUserId },
    attributes: ["rating"],
  });

  const teacherProfile = await TeacherProfiles.findByPk(teacherUserId);
  if (!teacherProfile) {
    return;
  }

  const reviewsCount = reviews.length;
  let ratingAvg = null;

  if (reviewsCount > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    ratingAvg = Number((totalRating / reviewsCount).toFixed(2));
  }

  await teacherProfile.update({
    ratingAvg,
    reviewsCount,
  });
}
