export enum ApiErrorType {
  NETWORK = "NETWORK_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED_ERROR",
  FORBIDDEN = "FORBIDDEN_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT_ERROR",
  SERVER = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  ABORTED = "ABORTED_ERROR",
}

export interface ApiErrorData {
  code?: string;
  details?: Record<string, any>;
  validationErrors?: Record<string, string[]>;
  retryAfter?: number;
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
      case 429:
        return new ApiError(
          message || "Rate limit exceeded",
          ApiErrorType.RATE_LIMIT,
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
      case 0:
        return new ApiError(
          message || "Request aborted",
          ApiErrorType.ABORTED,
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

export class NetworkError extends ApiError {
  constructor(message: string = "Network error occurred") {
    super(message, ApiErrorType.NETWORK, 0);
    this.name = "NetworkError";
  }
}
