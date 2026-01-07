/**
 * Secure logging utility to prevent sensitive data leakage.
 * In production, this should avoid logging stack traces or raw error objects.
 */

// Simple environment check - in a real app this might be more robust
const isDevelopment = import.meta.env.DEV;

/**
 * Logs an error securely.
 * In development, it logs the full error.
 * In production, it only logs the message to avoid leaking stack traces or sensitive data structure.
 *
 * @param message Context message
 * @param error The error object or unknown value
 */
export const logError = (message: string, error?: unknown): void => {
  if (isDevelopment) {
    console.error(message, error);
  } else {
    // In production, sanitizing the output
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${message}: ${errorMessage}`);
  }
};
