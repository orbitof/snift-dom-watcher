/**
 * Format current timestamp in ISO format with milliseconds
 * @returns Formatted timestamp (e.g., "2024-04-06T13:37:42.123Z")
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Add timestamp to log message
 */
export function formatLog(message: string): string {
  return `${getTimestamp()} ${message}`;
}