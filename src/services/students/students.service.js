import db from "../../models/index.js";
import { assertOrThrow } from "../../utils/errors.js";
const { StudentProfiles } = db;

/**
 * Get my student profile
 * @param {string} userId
 * @returns {Promise<{userId: string, city: string, level: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "UNIVERSITY" | "OTHER", track: string, createdAt: Date, updatedAt: Date}>}
 */
export async function getMyStudentProfile(userId) {
  const studentProfile = await StudentProfiles.findOne({
    where: { userId },
  });
  assertOrThrow(studentProfile, 404, "NOT_FOUND", "Student profile not found");
  return {
    userId: studentProfile.userId,
    city: studentProfile.city,
    level: studentProfile.level,
    track: studentProfile.track,
    createdAt: studentProfile.createdAt,
    updatedAt: studentProfile.updatedAt,
  };
}

/**
 * Edit my student profile
 * @param {{ city?: string, level?: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "UNIVERSITY" | "OTHER", track?: string }} payload
 * @param {string|number} userId
 */
export async function editMyStudentProfile(payload, userId) {
  const studentProfile = await StudentProfiles.findOne({ where: { userId } });
  assertOrThrow(studentProfile, 404, "NOT_FOUND", "Student profile not found");

  const updates = {};

  if (payload.city !== undefined) {
    const city = String(payload.city).trim();
    assertOrThrow(
      city.length > 0,
      400,
      "VALIDATION_ERROR",
      "City must be at least 1 character long",
    );
    assertOrThrow(
      city.length <= 255,
      400,
      "VALIDATION_ERROR",
      "City must be at most 255 characters long",
    );
    updates.city = city;
  }

  if (payload.level !== undefined) {
    const validLevels = ["MIDDLE_SCHOOL", "HIGH_SCHOOL", "UNIVERSITY", "OTHER"];
    assertOrThrow(
      validLevels.includes(payload.level),
      400,
      "VALIDATION_ERROR",
      `Level must be one of: ${validLevels.join(", ")}`,
    );
    updates.level = payload.level;
  }

  if (payload.track !== undefined) {
    const track = String(payload.track).trim();
    assertOrThrow(
      track.length > 0,
      400,
      "VALIDATION_ERROR",
      "Track must be at least 1 character long",
    );
    assertOrThrow(
      track.length <= 255,
      400,
      "VALIDATION_ERROR",
      "Track must be at most 255 characters long",
    );
    updates.track = track;
  }

  await studentProfile.update(updates);

  return {
    userId: studentProfile.userId,
    city: studentProfile.city,
    level: studentProfile.level,
    track: studentProfile.track,
    createdAt: studentProfile.createdAt,
    updatedAt: studentProfile.updatedAt,
  };
}

/**
 * Get student profile by user ID
 * @param {string|number} userId
 * @returns {Promise<{userId: string|number, city: string, level: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "UNIVERSITY" | "OTHER", track: string, createdAt: Date, updatedAt: Date}>}
 */
export async function getStudentProfile(userId) {
  const studentProfile = await StudentProfiles.findOne({
    where: { userId },
  });
  assertOrThrow(studentProfile, 404, "NOT_FOUND", "Student profile not found");
  return {
    userId: studentProfile.userId,
    city: studentProfile.city,
    level: studentProfile.level,
    track: studentProfile.track,
    createdAt: studentProfile.createdAt,
    updatedAt: studentProfile.updatedAt,
  };
}
