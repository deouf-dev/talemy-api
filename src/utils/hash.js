import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password.
 * @param {String} plainPassword - password in plain text
 * @returns {Promise<String>} hashed password
 */
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password.
 * @param {String} plainPassword
 * @param {String} hashedPassword
 * @returns {Promise<Boolean>}
 */

export async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
