import { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { axiosInstance } from "./axiosInstance";
import { ApiResponse } from "@shared/interfaces";
import { logger } from "./logger";
import { ApiError, ApiErrorType } from "./errors/apiErrors";

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
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      logger.logAPIResponse({
        config: response.config,
        status: response.status,
        data: response.data,
      });

      if (!response.data || response.data.data === undefined) {
        throw new ApiError(
          "Invalid API response structure",
          ApiErrorType.SERVER,
          500
        );
      }

      return {
        data: this.serializeDates(response.data.data),
        pagination: response.data.pagination,
        status: response.data.status,
        message: response.data.message,
        errors: response.data.errors,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        logger.logAPIError(error);
        throw error;
      }

      if ((error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError<any>;
        const status = axiosError.response?.status || 500;
        const message =
          axiosError.response?.data?.message || axiosError.message;
        const data = axiosError.response?.data;

        const apiError = ApiError.fromHttpError(status, message, data);
        logger.logAPIError(apiError);
        throw apiError;
      }

      const unknownError = new ApiError(
        "An unexpected error occurred",
        ApiErrorType.UNKNOWN,
        500
      );
      logger.logAPIError(unknownError);
      throw unknownError;
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
