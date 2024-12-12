import { ApiResponse, PaginationOptions } from "@shared/interfaces";
import {
  ApiError,
  ApiErrorType,
  NetworkError,
} from "@/lib/api/errors/apiErrors";
import { testLogger } from "../utils/testLogger";

// Types for mock configuration
interface MockServiceConfig {
  shouldSucceed?: boolean;
  delay?: number;
  error?: ApiError;
}

interface MockEndpointConfig extends MockServiceConfig {
  data?: any;
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

// Base mock response creators
export function createMockApiResponse<T>(
  data: T,
  options: {
    hasMore?: boolean;
    nextCursor?: string;
    total?: number;
    status?: number;
  } = {}
): ApiResponse<T> {
  const { hasMore = false, nextCursor, total, status = 200 } = options;

  return {
    data,
    status,
    pagination: hasMore
      ? {
          hasMore,
          nextCursor,
          total,
        }
      : undefined,
  };
}

export function createMockApiError(
  message: string,
  type: ApiErrorType = ApiErrorType.UNKNOWN,
  status: number = 500,
  details?: Record<string, any>
): ApiError {
  testLogger.debug("Creating mock API error", {
    message,
    type,
    status,
    details,
  });
  return new ApiError(message, type, status, details);
}

// Error simulation utilities
export function simulateNetworkError(): NetworkError {
  testLogger.debug("Simulating network error");
  return new NetworkError("Network error occurred");
}

export function simulateValidationError(
  validationErrors: Record<string, string[]>
): ApiError {
  testLogger.debug("Simulating validation error", { validationErrors });
  return createMockApiError("Validation failed", ApiErrorType.VALIDATION, 400, {
    validationErrors,
  });
}

export function simulateAuthError(): ApiError {
  testLogger.debug("Simulating auth error");
  return createMockApiError("Unauthorized", ApiErrorType.UNAUTHORIZED, 401);
}

export function simulateForbiddenError(): ApiError {
  testLogger.debug("Simulating forbidden error");
  return createMockApiError("Forbidden", ApiErrorType.FORBIDDEN, 403);
}

export function simulateServerError(): ApiError {
  testLogger.debug("Simulating server error");
  return createMockApiError("Internal server error", ApiErrorType.SERVER, 500);
}

export function simulateNotFoundError(resource: string): ApiError {
  testLogger.debug("Simulating not found error", { resource });
  return createMockApiError(
    `${resource} not found`,
    ApiErrorType.NOT_FOUND,
    404
  );
}

export function simulateRateLimitError(): ApiError {
  testLogger.debug("Simulating rate limit error");
  return createMockApiError(
    "Rate limit exceeded",
    ApiErrorType.RATE_LIMIT,
    429,
    {
      retryAfter: 60,
    }
  );
}

export function simulateAbortError(): ApiError {
  testLogger.debug("Simulating request abort");
  return createMockApiError("Request aborted", ApiErrorType.ABORTED, 0);
}

// Mock response delay utility
export async function mockDelay(ms: number = 100): Promise<void> {
  testLogger.debug("Simulating delay", { ms });
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock API response wrapper
export async function createMockApiCall<T>(
  data: T,
  config: MockEndpointConfig = {}
): Promise<ApiResponse<T>> {
  const { shouldSucceed = true, delay = 0, error, pagination } = config;

  testLogger.debug("Creating mock API call", {
    shouldSucceed,
    delay,
    hasPagination: !!pagination,
  });

  if (delay) {
    await mockDelay(delay);
  }

  if (!shouldSucceed) {
    throw error || simulateServerError();
  }

  return createMockApiResponse(data, {
    hasMore: pagination?.hasMore,
    nextCursor: pagination?.nextCursor,
    total: pagination?.total,
    status: 200,
  });
}

// Mock pagination helper
export function createMockPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  testLogger.debug("Creating paginated response", { page, limit, total });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return createMockApiResponse(paginatedData, {
    hasMore,
    nextCursor: hasMore ? String(page + 1) : undefined,
    total,
    status: 200,
  });
}
