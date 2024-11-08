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
  ): Promise<T> {
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

      return response.data.data;
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
}
