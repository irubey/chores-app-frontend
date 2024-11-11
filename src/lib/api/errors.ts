export enum ApiErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

/**
 * Base class for API-related errors.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly type: ApiErrorType;
  public readonly data: any;

  constructor(message: string, type: ApiErrorType, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.data = data;
  }

  static fromHttpError(status: number, message: string, data?: any): ApiError {
    let type: ApiErrorType;
    switch (status) {
      case 400:
        type = ApiErrorType.VALIDATION;
        break;
      case 401:
        type = ApiErrorType.AUTHENTICATION;
        break;
      case 403:
        type = ApiErrorType.AUTHORIZATION;
        break;
      case 404:
        type = ApiErrorType.NOT_FOUND;
        break;
      case 500:
        type = ApiErrorType.SERVER;
        break;
      default:
        type = ApiErrorType.UNKNOWN;
    }
    return new ApiError(message, type, status, data);
  }
}

/**
 * Represents network-related errors.
 */
export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message, ApiErrorType.NETWORK, 0);
    this.name = "NetworkError";
  }
}

/**
 * Represents authentication-related errors.
 */
export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, ApiErrorType.AUTHENTICATION, 401);
    this.name = "AuthenticationError";
  }
}
