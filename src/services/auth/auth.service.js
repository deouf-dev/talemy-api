import db from "../../models/index.js";
import {
  hashPassword,
  comparePassword,
  assertOrThrow,
  generateAccessToken,
} from "../../utils/index.js";
const { User, StudentProfiles, TeacherProfiles, Subjects } = db;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
/**
 * Register a new user
 * @param {Object} payload - user data
 * @return {Promise<{id: string, email: string, name: string, surname: string, role: string, createdAt: Date, updatedAt: Date}>} created user
 */

export async function registerUser(payload) {
  const name = payload?.name?.trim();
  const surname = payload?.surname?.trim();
  const emailRaw = payload?.email?.toLowerCase().trim();
  const password = payload?.password;
  const role = payload?.role;

  assertOrThrow(name, 400, "VALIDATION_ERROR", "Name is required");
  assertOrThrow(surname, 400, "VALIDATION_ERROR", "Surname is required");
  assertOrThrow(emailRaw, 400, "VALIDATION_ERROR", "Email is required");
  assertOrThrow(password, 400, "VALIDATION_ERROR", "Password is required");
  assertOrThrow(
    ["STUDENT", "TEACHER"].includes(role),
    400,
    "VALIDATION_ERROR",
    "Invalid role",
  );
  const email = normalizeEmail(emailRaw);

  const existingUser = await User.scope("withPassword").findOne({
    where: { email },
  });
  assertOrThrow(!existingUser, 409, "CONFLICT", "Email is already in use");

  const hashedPassword = await hashPassword(password);
  payload.passwordHash = hashedPassword;
  payload.email = email;

  try {
    const newUser = await db.sequelize.transaction(async (t) => {
      const createdUser = await User.create(
        {
          name,
          surname,
          email,
          passwordHash: hashedPassword,
          role,
        },
        { transaction: t },
      );
      if (role === "STUDENT") {
        await StudentProfiles.create(
          { userId: createdUser.id },
          { transaction: t },
        );
      } else if (role === "TEACHER") {
        await TeacherProfiles.create(
          { userId: createdUser.id },
          { transaction: t },
        );
      }
      return createdUser;
    });
    const token = generateAccessToken({
      sub: String(newUser.id),
      role: newUser.role,
    });
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      surname: newUser.surname,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      token: token,
    };
  } catch (error) {
    throw new Error("Error registering user: " + error.message);
  }
}
/**
 * Login user and return JWT token
 * @param {Object} payload
 * @return {Promise<{token: string, user: Object}>} token and user data
 */
export async function loginUser(payload) {
  assertOrThrow(
    payload?.email && payload?.password,
    400,
    "VALIDATION_ERROR",
    "Email and password are required",
  );
  const user = await User.scope("withPassword").findOne({
    where: { email: normalizeEmail(payload.email) },
  });
  assertOrThrow(user, 401, "UNAUTHORIZED", "Invalid email or password");

  const isPasswordValid = await comparePassword(
    payload.password,
    user.passwordHash,
  );
  assertOrThrow(
    isPasswordValid,
    401,
    "UNAUTHORIZED",
    "Invalid email or password",
  );

  const token = generateAccessToken({ sub: String(user.id), role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: normalizeEmail(user.email),
      name: user.name,
      surname: user.surname,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}
/**
 * Get current user info
 * @param {string} userId
 * @returns {Promise<{id: string, email: string, name: string, surname: string, role: string, createdAt: Date, updatedAt: Date}>} user data
 */
export async function getMe(userId) {
  const user = await User.findByPk(userId);
  assertOrThrow(user, 401, "UNAUTHORIZED", "User not found");
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: user.name,
    surname: user.surname,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
