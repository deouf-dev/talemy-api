/**
 * @param {string} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
