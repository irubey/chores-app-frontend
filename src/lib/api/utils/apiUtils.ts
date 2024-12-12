// src/lib/api/utils/apiUtils.ts
import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiError, ApiErrorType } from "../errors/apiErrors";
import { logger } from "../logger";
import { PaginationMeta, PaginationOptions } from "@shared/interfaces";
import { ApiResponse } from "@shared/interfaces/apiResponse";

// Add interface for logger methods
interface APILogData {
  config?: {
    url?: string;
    method?: string;
  };
  status?: number;
  data?: unknown;
}

interface APIErrorData {
  message: string;
  status?: number;
  type?: string;
  data?: unknown;
}

// Extend logger type to include these methods
declare module "../logger" {
  interface Logger {
    logAPIResponse(data: APILogData): void;
    logAPIError(data: APIErrorData): void;
  }
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
  params?: PaginationOptions & Record<string, any>;
}

// Main request handler
export const handleApiRequest = async <T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>,
  context?: { operation?: string; metadata?: Record<string, unknown> }
): Promise<ApiResponse<T>> => {
  try {
    // Log request attempt
    logger.debug(`API Request: ${context?.operation || "Unknown Operation"}`, {
      ...context?.metadata,
      timestamp: new Date().toISOString(),
    });

    const response = await request();

    // Log successful response
    logger.logAPIResponse({
      config: {
        url: response.config.url,
        method: response.config.method,
      },
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    // Log error before throwing
    logger.logAPIError({
      message: error instanceof Error ? error.message : "Unknown error",
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      type: error instanceof ApiError ? error.type : "UNKNOWN",
      data: axios.isAxiosError(error) ? error.response?.data : undefined,
    });

    throw error;
  }
};

// Query key factories
export const createQueryKeys = (domain: string) => ({
  all: [domain] as const,
  lists: () => [...createQueryKeys(domain).all, "list"] as const,
  list: (config: ApiRequestOptions) =>
    [...createQueryKeys(domain).lists(), config] as const,
  details: () => [...createQueryKeys(domain).all, "detail"] as const,
  detail: (id: string) => [...createQueryKeys(domain).details(), id] as const,
});

// Request builders
export const buildRequestConfig = (config?: ApiRequestOptions) => ({
  params: config?.params,
  signal: config?.signal,
});

// Type guards
export const isPaginatedResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { pagination: PaginationMeta } => {
  return !!response.pagination;
};

// Cache time constants
export const CACHE_TIMES = {
  STANDARD: 5 * 60 * 1000, // 5 minutes
  SHORT: 60 * 1000, // 1 minute
  LONG: 30 * 60 * 1000, // 30 minutes
} as const;

// Stale time constants
export const STALE_TIMES = {
  STANDARD: 30 * 1000, // 30 seconds
  SHORT: 10 * 1000, // 10 seconds
  LONG: 5 * 60 * 1000, // 5 minutes
} as const;
