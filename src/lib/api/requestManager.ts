import { logger } from "./logger";

interface RequestOptions {
  signal?: AbortSignal;
  requiresAuth?: boolean;
  timeout?: number;
  retry?: {
    retries: number;
    backoff?: boolean;
  };
}

export class RequestManager {
  private static instance: RequestManager;
  private requestsInProgress: Map<string, Promise<any>> = new Map();
  private abortController: AbortController | null = null;

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
    const { retry, timeout, signal } = options;
    const maxRetries = retry?.retries ?? 0;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const promise = request();
        return timeout
          ? await this.executeWithTimeout(promise, timeout, signal)
          : await promise;
      } catch (error) {
        attempt++;

        // Don't retry if request was aborted or we're out of retries
        if (
          error.name === "AbortError" ||
          attempt > maxRetries ||
          error.response?.status === 401 || // Don't retry auth errors
          error.response?.status === 403
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
    const { signal, requiresAuth } = options;

    // Use provided signal or create new one
    if (!this.abortController || this.abortController.signal.aborted) {
      this.abortController = new AbortController();
    }

    const finalSignal = signal || this.abortController.signal;

    if (this.requestsInProgress.has(key)) {
      logger.debug("Using existing request", { key });
      return this.requestsInProgress.get(key)!;
    }

    logger.debug("Starting new request", { key, requiresAuth });

    const promise = this.executeWithRetry(() => request(), options)
      .catch((error) => {
        if (error.name === "AbortError") {
          logger.debug("Request aborted", { key });
        } else {
          logger.error("Request failed", { key, error });
        }
        throw error;
      })
      .finally(() => {
        if (this.requestsInProgress.get(key) === promise) {
          logger.debug("Request completed and cleaned up", { key });
          this.requestsInProgress.delete(key);
        }
      });

    this.requestsInProgress.set(key, promise);
    return promise;
  }

  abortAll(): void {
    logger.debug("Aborting all requests", {
      activeRequests: Array.from(this.requestsInProgress.keys()),
    });

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = new AbortController();
    }
    this.requestsInProgress.clear();
  }

  getActiveRequests(): string[] {
    return Array.from(this.requestsInProgress.keys());
  }
}

export const requestManager = RequestManager.getInstance();
