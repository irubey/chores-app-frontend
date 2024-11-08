export enum ApiErrorType {
  NETWORK = "NETWORK_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",
  SERVER = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

export interface ApiErrorData {
  code?: string;
  details?: Record<string, any>;
  validationErrors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly status: number;
  public readonly data?: ApiErrorData;

  constructor(
    message: string,
    type: ApiErrorType = ApiErrorType.UNKNOWN,
    status: number = 500,
    data?: ApiErrorData
  ) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.data = data;
  }

  static fromHttpError(
    status: number,
    message?: string,
    data?: ApiErrorData
  ): ApiError {
    switch (status) {
      case 400:
        return new ApiError(
          message || "Invalid request",
          ApiErrorType.VALIDATION,
          status,
          data
        );
      case 401:
        return new ApiError(
          message || "Unauthorized",
          ApiErrorType.UNAUTHORIZED,
          status,
          data
        );
      case 403:
        return new ApiError(
          message || "Forbidden",
          ApiErrorType.FORBIDDEN,
          status,
          data
        );
      case 404:
        return new ApiError(
          message || "Resource not found",
          ApiErrorType.NOT_FOUND,
          status,
          data
        );
      case 409:
        return new ApiError(
          message || "Resource conflict",
          ApiErrorType.CONFLICT,
          status,
          data
        );
      case 500:
        return new ApiError(
          message || "Internal server error",
          ApiErrorType.SERVER,
          status,
          data
        );
      default:
        return new ApiError(
          message || "Unknown error",
          ApiErrorType.UNKNOWN,
          status,
          data
        );
    }
  }
}
