/**
 * Extract a meaningful error message from any type of error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
}