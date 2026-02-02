import db from "../../models/index.js";
import { assertOrThrow, clampInt } from "../../utils/index.js";
import { Op } from "sequelize";

const { AvailabilitySlots, User } = db;

/**
 * Create an availability slot for a teacher
 * @param {{teacherUserId: number, dayOfWeek: number, startAt: Date|string, endAt: Date|string}} payload
 * @returns {Promise<Object>}
 */
export async function createAvailabilitySlot(payload) {
  const { teacherUserId, dayOfWeek, startAt, endAt } = payload;

  // Verify teacher exists and has the right role
  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  // Validate dayOfWeek (0 = Sunday, 6 = Saturday)
  assertOrThrow(
    Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6,
    400,
    "VALIDATION_ERROR",
    "Day of week must be an integer between 0 and 6",
  );

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  // Validate dates
  assertOrThrow(
    startDate < endDate,
    400,
    "VALIDATION_ERROR",
    "Start time must be before end time",
  );

  // Check for overlapping slots
  const overlappingSlot = await AvailabilitySlots.findOne({
    where: {
      teacherUserId,
      dayOfWeek,
      [Op.or]: [
        {
          // New slot starts during an existing slot
          startAt: { [Op.lte]: startDate },
          endAt: { [Op.gt]: startDate },
        },
        {
          // New slot ends during an existing slot
          startAt: { [Op.lt]: endDate },
          endAt: { [Op.gte]: endDate },
        },
        {
          // New slot completely encompasses an existing slot
          startAt: { [Op.gte]: startDate },
          endAt: { [Op.lte]: endDate },
        },
      ],
    },
  });

  assertOrThrow(
    !overlappingSlot,
    409,
    "CONFLICT",
    "This slot overlaps with an existing availability slot",
  );

  const slot = await AvailabilitySlots.create({
    teacherUserId,
    dayOfWeek,
    startAt: startDate,
    endAt: endDate,
  });

  return slot;
}

/**
 * Get availability slots for a teacher
 * @param {{teacherUserId: number, dayOfWeek?: number}} params
 * @returns {Promise<Array>}
 */
export async function getTeacherAvailability({ teacherUserId, dayOfWeek }) {
  // Verify teacher exists
  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  const whereClause = { teacherUserId };

  if (dayOfWeek !== undefined) {
    assertOrThrow(
      Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6,
      400,
      "VALIDATION_ERROR",
      "Day of week must be an integer between 0 and 6",
    );
    whereClause.dayOfWeek = dayOfWeek;
  }

  const slots = await AvailabilitySlots.findAll({
    where: whereClause,
    order: [
      ["dayOfWeek", "ASC"],
      ["startAt", "ASC"],
    ],
  });

  return slots;
}

/**
 * Get my availability slots (for authenticated teacher)
 * @param {number} teacherUserId
 * @returns {Promise<Array>}
 */
export async function getMyAvailability(teacherUserId) {
  const slots = await AvailabilitySlots.findAll({
    where: { teacherUserId },
    order: [
      ["dayOfWeek", "ASC"],
      ["startAt", "ASC"],
    ],
  });

  return slots;
}

/**
 * Get a single availability slot by ID
 * @param {number} slotId
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function getAvailabilitySlotById(slotId, userId) {
  const slot = await AvailabilitySlots.findByPk(slotId);
  assertOrThrow(slot, 404, "NOT_FOUND", "Availability slot not found");

  // Verify the user has access to this slot
  assertOrThrow(
    slot.teacherUserId === userId,
    403,
    "FORBIDDEN",
    "You do not have access to this availability slot",
  );

  return slot;
}

/**
 * Update an availability slot
 * @param {{slotId: number, teacherUserId: number, dayOfWeek?: number, startAt?: Date|string, endAt?: Date|string}} params
 * @returns {Promise<Object>}
 */
export async function updateAvailabilitySlot({
  slotId,
  teacherUserId,
  dayOfWeek,
  startAt,
  endAt,
}) {
  const slot = await AvailabilitySlots.findByPk(slotId);
  assertOrThrow(slot, 404, "NOT_FOUND", "Availability slot not found");

  // Only the teacher who created the slot can update it
  assertOrThrow(
    slot.teacherUserId === teacherUserId,
    403,
    "FORBIDDEN",
    "You do not have permission to update this slot",
  );

  const updates = {};

  if (dayOfWeek !== undefined) {
    assertOrThrow(
      Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6,
      400,
      "VALIDATION_ERROR",
      "Day of week must be an integer between 0 and 6",
    );
    updates.dayOfWeek = dayOfWeek;
  }

  if (startAt !== undefined) {
    updates.startAt = new Date(startAt);
  }

  if (endAt !== undefined) {
    updates.endAt = new Date(endAt);
  }

  // Validate dates if both are being updated
  const finalStartAt = updates.startAt || slot.startAt;
  const finalEndAt = updates.endAt || slot.endAt;

  assertOrThrow(
    finalStartAt < finalEndAt,
    400,
    "VALIDATION_ERROR",
    "Start time must be before end time",
  );

  assertOrThrow(
    Object.keys(updates).length > 0,
    400,
    "VALIDATION_ERROR",
    "At least one field must be provided",
  );

  // Check for overlapping slots (excluding the current slot)
  const finalDayOfWeek = updates.dayOfWeek ?? slot.dayOfWeek;
  const overlappingSlot = await AvailabilitySlots.findOne({
    where: {
      teacherUserId,
      dayOfWeek: finalDayOfWeek,
      id: { [Op.ne]: slotId },
      [Op.or]: [
        {
          startAt: { [Op.lte]: finalStartAt },
          endAt: { [Op.gt]: finalStartAt },
        },
        {
          startAt: { [Op.lt]: finalEndAt },
          endAt: { [Op.gte]: finalEndAt },
        },
        {
          startAt: { [Op.gte]: finalStartAt },
          endAt: { [Op.lte]: finalEndAt },
        },
      ],
    },
  });

  assertOrThrow(
    !overlappingSlot,
    409,
    "CONFLICT",
    "This slot overlaps with an existing availability slot",
  );

  await slot.update(updates);

  return slot;
}

/**
 * Delete an availability slot
 * @param {number} slotId
 * @param {number} teacherUserId
 * @returns {Promise<void>}
 */
export async function deleteAvailabilitySlot(slotId, teacherUserId) {
  const slot = await AvailabilitySlots.findByPk(slotId);
  assertOrThrow(slot, 404, "NOT_FOUND", "Availability slot not found");

  // Only the teacher who created the slot can delete it
  assertOrThrow(
    slot.teacherUserId === teacherUserId,
    403,
    "FORBIDDEN",
    "You do not have permission to delete this slot",
  );

  await slot.destroy();
}

/**
 * Delete all availability slots for a teacher
 * @param {number} teacherUserId
 * @returns {Promise<number>} - Number of deleted slots
 */
export async function deleteAllAvailabilitySlots(teacherUserId) {
  const deletedCount = await AvailabilitySlots.destroy({
    where: { teacherUserId },
  });

  return deletedCount;
}
