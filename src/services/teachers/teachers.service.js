import db from "../../models/index.js";
import { assertOrThrow, clampInt } from "../../utils/index.js";
import { Op } from "sequelize";
const { TeacherProfiles, User, Subjects } = db;

/**
 * Get my teacher profile
 * @param {string} userId
 * @returns {Promise<{userId: string, bio: string, city: string, hourlyRate: string, user: object, createdAt: Date, updatedAt: Date}>}
 */
export async function getMyTeacherProfile(userId) {
  const teacherProfile = await TeacherProfiles.findByPk(userId, {
    include: [
      {
        model: Subjects,
        as: "subjects",
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    ],
  });
  const user = await User.findOne({ where: { id: userId } });
  assertOrThrow(
    user && user.role === "TEACHER",
    403,
    "FORBIDDEN",
    "User is not a teacher",
  );

  assertOrThrow(teacherProfile, 404, "NOT_FOUND", "Teacher profile not found");
  return {
    userId: teacherProfile.userId,
    name: user.name,
    surname: user.surname,
    role: user.role,
    bio: teacherProfile.bio,
    city: teacherProfile.city,
    ratingAvg: teacherProfile.ratingAvg,
    reviewsCount: teacherProfile.reviewsCount,
    user: {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
    },
    hourlyRate: teacherProfile.hourlyRate,
    subjects: teacherProfile.subjects,
    createdAt: teacherProfile.createdAt,
    updatedAt: teacherProfile.updatedAt,
  };
}
/**
 * Edit my teacher profile
 * @param {{ bio?: string, city?: string, hourlyRate?: string|number }} payload
 * @param {string|number} userId
 * @return {Promise<{userId: string|number, bio: string|null, city: string|null, hourlyRate: number|null, createdAt: Date, updatedAt: Date}>}
 */
export async function editMyTeacherProfile(payload, userId) {
  const teacherProfile = await TeacherProfiles.findOne({ where: { userId } });
  assertOrThrow(teacherProfile, 404, "NOT_FOUND", "Teacher profile not found");

  const updates = {};

  if (payload.bio !== undefined) {
    const bio = String(payload.bio).trim();
    assertOrThrow(
      bio.length > 0,
      400,
      "VALIDATION_ERROR",
      "Bio must be at least 1 character long",
    );
    assertOrThrow(
      bio.length <= 2000,
      400,
      "VALIDATION_ERROR",
      "Bio must be at most 2000 characters long",
    );
    updates.bio = bio;
  }

  if (payload.city !== undefined) {
    const city = String(payload.city).trim();
    assertOrThrow(
      city.length > 0,
      400,
      "VALIDATION_ERROR",
      "City must be at least 1 character long",
    );
    assertOrThrow(
      city.length <= 100,
      400,
      "VALIDATION_ERROR",
      "City must be at most 100 characters long",
    );
    updates.city = city;
  }

  if (payload.hourlyRate !== undefined) {
    const rate = Number(String(payload.hourlyRate).trim());

    assertOrThrow(
      Number.isFinite(rate),
      400,
      "VALIDATION_ERROR",
      "Hourly rate must be a valid number",
    );
    assertOrThrow(
      rate > 0,
      400,
      "VALIDATION_ERROR",
      "Hourly rate must be a positive number",
    );

    updates.hourlyRate = Number(rate.toFixed(2));
  }

  assertOrThrow(
    Object.keys(updates).length > 0,
    400,
    "VALIDATION_ERROR",
    "At least one field must be provided",
  );

  await teacherProfile.update(updates);

  return {
    userId: teacherProfile.userId,
    bio: teacherProfile.bio ?? null,
    city: teacherProfile.city ?? null,
    hourlyRate: teacherProfile.hourlyRate ?? null,
    ratingAvg: teacherProfile.ratingAvg,
    reviewsCount: teacherProfile.reviewsCount,
    createdAt: teacherProfile.createdAt,
    updatedAt: teacherProfile.updatedAt,
  };
}

/**
 * Get a teacher profile by userId
 * @param {string} userId
 * @returns {Promise<{userId: string, bio: string, city: string, hourlyRate: string, createdAt: Date, updatedAt: Date}>}
 */
export async function getTeacherProfile(userId) {
  const teacherProfile = await TeacherProfiles.findByPk(userId, {
    include: [
      {
        model: Subjects,
        as: "subjects",
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    ],
  });
  const user = await User.findOne({ where: { id: userId } });
  assertOrThrow(
    user && user.role === "TEACHER",
    403,
    "FORBIDDEN",
    "User is not a teacher",
  );
  assertOrThrow(teacherProfile, 404, "NOT_FOUND", "Teacher profile not found");
  return {
    userId: teacherProfile.userId,
    name: user.name,
    surname: user.surname,
    role: user.role,
    bio: teacherProfile.bio,
    city: teacherProfile.city,
    hourlyRate: teacherProfile.hourlyRate,
    subjects: teacherProfile.subjects,
    ratingAvg: teacherProfile.ratingAvg,
    reviewsCount: teacherProfile.reviewsCount,
    createdAt: teacherProfile.createdAt,
    updatedAt: teacherProfile.updatedAt,
  };
}

export async function editMyTeacherSubjects(userId, subjectIds) {
  assertOrThrow(
    Array.isArray(subjectIds),
    400,
    "VALIDATION_ERROR",
    "subjectIds must be an array",
  );
  const uniqueIds = [...new Set(subjectIds)];

  return await db.sequelize.transaction(async (t) => {
    const teacherProfile = await TeacherProfiles.findByPk(userId, {
      transaction: t,
    });
    assertOrThrow(
      teacherProfile,
      404,
      "NOT_FOUND",
      "Teacher profile not found",
    );

    const validCount = await Subjects.count({
      where: { id: { [Op.in]: uniqueIds } },
      transaction: t,
    });

    assertOrThrow(
      validCount === uniqueIds.length,
      400,
      "VALIDATION_ERROR",
      "One or more subject IDs are invalid",
    );

    await teacherProfile.setSubjects(uniqueIds, { transaction: t });

    await teacherProfile.reload({
      include: [
        {
          model: Subjects,
          as: "subjects",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    return teacherProfile;
  });
}

/**
 * Search teachers
 * @param {{city?: string, subjectId?: number, page: number, pageSize: number }} query - filter criteria
 * @returns {Promise<{id: string, name: string, surname: string, email: string, city: string, hourlyRate: number, bio: string, subjects: {id: string, name: string}[]}[]>} list of teachers matching the criteria
 */

export async function searchTeachers(query) {
  const { city, subjectId } = query;

  const page = clampInt(query.page, 1, 1, 10_000);
  const pageSize = clampInt(query.pageSize, 20, 1, 50);
  const offset = (page - 1) * pageSize;

  const whereTeacher = {};
  if (city) whereTeacher.city = city;

  const include = [
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "surname", "email"],
    },
    {
      model: Subjects,
      as: "subjects",
      attributes: ["id", "name"],
      through: { attributes: [] },
      ...(subjectId
        ? { where: { id: subjectId }, required: true }
        : { required: false }),
    },
  ];

  const { rows, count } = await TeacherProfiles.findAndCountAll({
    where: whereTeacher,
    include,
    distinct: true,
    subQuery: false,
    limit: pageSize,
    offset,
    order: [["updatedAt", "DESC"]],
  });

  return {
    items: rows.map((teacherProfile) => ({
      id: teacherProfile.user.id,
      name: teacherProfile.user.name,
      surname: teacherProfile.user.surname,
      email: teacherProfile.user.email,
      city: teacherProfile.city,
      hourlyRate: teacherProfile.hourlyRate,
      ratingAvg: teacherProfile.ratingAvg,
      reviewsCount: teacherProfile.reviewsCount,
      bio: teacherProfile.bio,
      subjects: teacherProfile.subjects,
    })),
    page,
    pageSize,
    total: count,
  };
}
