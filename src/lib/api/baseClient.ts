import { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { axiosInstance } from "./axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import { logger } from "./logger";
import { ApiError, ApiErrorType } from "./errors/apiErrors";
import axios from "axios";

// Type guard for ApiError-like objects
function isApiErrorLike(error: unknown): error is {
  type: ApiErrorType | number;
  status: number;
  message: string;
} {
  return (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    "status" in error &&
    "message" in error
  );
}

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axiosInstance;

    this.axiosInstance.interceptors.request.use((config) => {
      logger.logAPIRequest({
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });
      return config;
    });
  }

  protected async handleRequest<T>(
    request: () => Promise<AxiosResponse<T>>
  ): Promise<T> {
    try {
      const response = await request();
      logger.debug("BaseClient successful response", {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
      });

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      if (!response.data) {
        throw new ApiError(
          "Invalid API response structure",
          ApiErrorType.SERVER,
          500
        );
      }

      return response.data;
    } catch (error) {
      logger.debug("BaseClient handling error", {
        errorType: error.constructor.name,
        isApiError: error instanceof ApiError,
        hasType: "type" in error,
        hasStatus: "status" in error,
        error:
          error instanceof ApiError
            ? {
                type: error.type,
                status: error.status,
                message: error.message,
              }
            : error,
      });

      if (error instanceof ApiError) {
        logger.debug("BaseClient received ApiError-like error", {
          type: error.type,
          status: error.status,
          message: error.message,
        });
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw ApiError.fromHttpError(
          error.response?.status || 500,
          error.response?.data?.message,
          error.response?.data
        );
      }

      throw error;
    }
  }

  private serializeDates<T>(data: T): T {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.serializeDates(item)) as unknown as T;
    }

    if (data instanceof Date) {
      return data.toISOString() as unknown as T;
    }

    if (typeof data === "object") {
      const result = {} as { [K in keyof T]: any };

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];

          if (value instanceof Date) {
            result[key] = value.toISOString();
          } else if (typeof value === "object" && value !== null) {
            result[key] = this.serializeDates(value);
          } else {
            result[key] = value;
          }
        }
      }

      return result as T;
    }

    return data;
  }
}
