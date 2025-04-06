/**
 * Convert duration string to milliseconds
 * @param duration Duration string (e.g. "30s", "1m", "1h")
 * @returns number of milliseconds
 * @throws Error if duration format is invalid
 */
export function parseInterval(duration: string): number {
  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(
      'Invalid duration format. Expected format: {number}s, {number}m, or {number}h (e.g. "30s", "1m", "1h")'
    );
  }

  const [, value, unit] = match;
  const numValue = parseInt(value, 10);

  switch (unit) {
    case 's':
      return numValue * 1000;
    case 'm':
      return numValue * 60 * 1000;
    case 'h':
      return numValue * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Validate interval string
 * @param interval Interval string to validate
 * @returns true if valid, throws Error if invalid
 */
export function validateInterval(interval: string): boolean {
  parseInterval(interval);
  return true;
}