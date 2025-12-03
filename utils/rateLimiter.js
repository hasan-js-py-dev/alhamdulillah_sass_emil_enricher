// Simple rate limiter to respect MailTester API rate limits.
// Maintains a timestamp of the last call and enforces a minimum delay before the next call.

let lastCallTimestamp = 0;

/**
 * Waits until at least `minDelayMs` milliseconds have passed since the last call.
 * Ensures we don't exceed rate limits when calling external APIs.
 *
 * @param {number} minDelayMs Minimum delay in milliseconds between calls.
 */
export async function waitForThrottle(minDelayMs) {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < minDelayMs) {
    const remaining = minDelayMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  lastCallTimestamp = Date.now();
}