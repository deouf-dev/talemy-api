import db from "../../models/index.js";
import { assertOrThrow, clampInt } from "../../utils/index.js";
import { Op } from "sequelize";

const { AvailabilitySlots, User } = db;

/**
 * Create an availability slot for a teacher
 * @param {{teacherUserId: number, dayOfWeek: number, startTime: Date|string, endTime: Date|string}} payload
 * @returns {Promise<Object>}
 */
export async function createAvailabilitySlot(payload) {
  const { teacherUserId, dayOfWeek, startTime, endTime } = payload;

  const teacher = await User.findByPk(teacherUserId);
  assertOrThrow(
    teacher && teacher.role === "TEACHER",
    404,
    "NOT_FOUND",
    "Teacher not found",
  );

  assertOrThrow(
    Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6,
    400,
    "VALIDATION_ERROR",
    "Day of week must be an integer between 0 and 6",
  );

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  assertOrThrow(
    startDate < endDate,
    400,
    "VALIDATION_ERROR",
    "Start time must be before end time",
  );

  const overlappingSlot = await AvailabilitySlots.findOne({
    where: {
      teacherUserId,
      dayOfWeek,
      [Op.or]: [
        {
          startTime: { [Op.lte]: startDate },
          endTime: { [Op.gt]: startDate },
        },
        {
          startTime: { [Op.lt]: endDate },
          endTime: { [Op.gte]: endDate },
        },
        {
          startTime: { [Op.gte]: startDate },
          endTime: { [Op.lte]: endDate },
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
    startTime: startDate,
    endTime: endDate,
  });

  return slot;
}

/**
 * Get availability slots for a teacher
 * @param {{teacherUserId: number, dayOfWeek?: number}} params
 * @returns {Promise<Array>}
 */
export async function getTeacherAvailability({ teacherUserId, dayOfWeek }) {
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
      ["startTime", "ASC"],
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
      ["startTime", "ASC"],
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
 * @param {{slotId: number, teacherUserId: number, dayOfWeek?: number, startTime?: Date|string, endTime?: Date|string}} params
 * @returns {Promise<Object>}
 */
export async function updateAvailabilitySlot({
  slotId,
  teacherUserId,
  dayOfWeek,
  startTime,
  endTime,
}) {
  const slot = await AvailabilitySlots.findByPk(slotId);
  assertOrThrow(slot, 404, "NOT_FOUND", "Availability slot not found");

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

  if (startTime !== undefined) {
    updates.startTime = new Date(startTime);
  }

  if (endTime !== undefined) {
    updates.endTime = new Date(endTime);
  }

  const finalStartTime = updates.startTime || slot.startTime;
  const finalEndTime = updates.endTime || slot.endTime;

  assertOrThrow(
    finalStartTime < finalEndTime,
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

  const finalDayOfWeek = updates.dayOfWeek ?? slot.dayOfWeek;
  const overlappingSlot = await AvailabilitySlots.findOne({
    where: {
      teacherUserId,
      dayOfWeek: finalDayOfWeek,
      id: { [Op.ne]: slotId },
      [Op.or]: [
        {
          startTime: { [Op.lte]: finalStartTime },
          endTime: { [Op.gt]: finalStartTime },
        },
        {
          startTime: { [Op.lt]: finalEndTime },
          endTime: { [Op.gte]: finalEndTime },
        },
        {
          startTime: { [Op.gte]: finalStartTime },
          endTime: { [Op.lte]: finalEndTime },
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
