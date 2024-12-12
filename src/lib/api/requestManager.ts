import { ApiError } from "./errors";
import { logger } from "./logger";

interface RequestOptions {
  signal?: AbortSignal;
  requiresAuth?: boolean;
  timeout?: number;
  retry?: {
    retries: number;
    backoff?: boolean;
  };
  batchId?: number; // For tracking request batches
}

export class RequestManager {
  private static instance: RequestManager;
  private requestsInProgress: Map<string, Promise<any>> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private cleanupTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private activeBatches: Set<number> = new Set();

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): RequestManager {
    if (!this.instance) {
      this.instance = new RequestManager();
      logger.debug("RequestManager instance created");
    }
    return this.instance;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Clean up timeout if signal is aborted
      signal?.addEventListener("abort", () => clearTimeout(timeoutId));
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private async executeWithRetry<T>(
    request: () => Promise<T>,
    options: RequestOptions
  ): Promise<T> {
    const { retry, timeout, signal, batchId } = options;
    const maxRetries = retry?.retries ?? 0;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Check if batch is still active before making request
        if (batchId && !this.activeBatches.has(batchId)) {
          throw new Error("Request batch cancelled");
        }

        const promise = request();
        return timeout
          ? await this.executeWithTimeout(promise, timeout, signal)
          : await promise;
      } catch (error) {
        attempt++;

        // Don't retry if request was aborted, batch cancelled, or we're out of retries
        if (
          (error instanceof Error && error.name === "AbortError") ||
          (error instanceof Error &&
            error.message === "Request batch cancelled") ||
          attempt > maxRetries ||
          (error instanceof ApiError && error.status === 401) || // Don't retry auth errors
          (error instanceof ApiError && error.status === 403)
        ) {
          throw error;
        }

        // Calculate backoff delay
        const delay = retry?.backoff
          ? Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          : 1000;

        logger.debug("Request failed, retrying", {
          attempt,
          maxRetries,
          delay,
          error,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Max retries exceeded");
  }

  async dedupRequest<T>(
    key: string,
    request: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { signal, requiresAuth, timeout = 10000, batchId } = options;

    // Register batch if provided
    if (batchId) {
      this.activeBatches.add(batchId);
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    // Combine signals if both exist
    const finalSignal = signal
      ? new AbortController().signal
      : controller.signal;

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    // Clear any existing cleanup timeout for this key
    if (this.cleanupTimeouts.has(key)) {
      logger.debug("Clearing existing cleanup timeout", { key });
      clearTimeout(this.cleanupTimeouts.get(key));
      this.cleanupTimeouts.delete(key);
    }

    // Check if there's an existing request in progress
    if (this.requestsInProgress.has(key)) {
      logger.debug("Reusing existing request", {
        key,
        activeRequests: this.getActiveRequests(),
      });
      return this.requestsInProgress.get(key)!;
    }

    logger.debug("Starting new request", {
      key,
      requiresAuth,
      batchId,
      activeRequests: this.getActiveRequests(),
    });

    const promise = this.executeWithRetry(() => request(), {
      ...options,
      signal: finalSignal,
    })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("Request aborted", { key });
        } else if (
          error instanceof Error &&
          error.message === "Request batch cancelled"
        ) {
          logger.debug("Request batch cancelled", { key, batchId });
        } else {
          logger.error("Request failed", { key, error });
        }
        throw error;
      })
      .finally(() => {
        // Only cleanup if this is still the active promise for this key
        if (this.requestsInProgress.get(key) === promise) {
          // Set a cleanup timeout with longer duration for Strict Mode
          const cleanupTimeout = setTimeout(() => {
            // Check if the request is still the active one before cleaning up
            if (this.requestsInProgress.get(key) === promise) {
              logger.debug("Cleaning up completed request", { key });
              this.requestsInProgress.delete(key);
              this.cleanupTimeouts.delete(key);
              this.abortControllers.delete(key);
            }
            if (batchId) {
              this.activeBatches.delete(batchId);
            }
          }, 10000); // Increased to 10 seconds for Strict Mode

          this.cleanupTimeouts.set(key, cleanupTimeout);
        }
      });

    // Store the promise
    this.requestsInProgress.set(key, promise);

    return promise;
  }

  abortRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  abortBatch(batchId: number): void {
    if (this.activeBatches.has(batchId)) {
      // Actively abort requests associated with the batch
      this.abortControllers.forEach((controller, key) => {
        if (key.startsWith(`batch-${batchId}-`)) {
          controller.abort();
          this.abortControllers.delete(key);
        }
      });

      this.activeBatches.delete(batchId);
      logger.debug("Batch aborted", { batchId });
    }
  }

  abortAll(): void {
    logger.debug("Aborting all requests", {
      activeRequests: Array.from(this.requestsInProgress.keys()),
    });

    // Clear all cleanup timeouts
    this.cleanupTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.cleanupTimeouts.clear();

    // Abort all controllers
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();

    // Clear all batches
    this.activeBatches.clear();

    this.requestsInProgress.clear();
  }

  getActiveRequests(): string[] {
    return Array.from(this.requestsInProgress.keys());
  }

  getActiveBatches(): number[] {
    return Array.from(this.activeBatches);
  }
}

export const requestManager = RequestManager.getInstance();
