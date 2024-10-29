// frontend/src/lib/api/retry.ts

/**
 * Sleeps for the specified duration.
 * @param ms - Milliseconds to sleep.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a function with exponential backoff.
 * @param fn - The function to retry.
 * @param retries - Number of retry attempts.
 * @param delay - Initial delay in milliseconds.
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 300
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
  }
}
