/**
 * Centralized error logging utility.
 * In production, this can be integrated with Sentry or other monitoring services.
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  console.error('[Global Error Log]:', error.message, {
    stack: error.stack,
    ...context,
  });

  // Example: Sentry.captureException(error, { extra: context });
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  console.info('[Global Info Log]:', message, context);
}
