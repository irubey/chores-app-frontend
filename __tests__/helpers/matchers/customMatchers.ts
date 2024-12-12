import { ApiResponse } from "@shared/interfaces";
import { ApiError, ApiErrorType } from "@/lib/api/errors";

// Use the common status type that's used in slices
type SliceStatus = "idle" | "loading" | "succeeded" | "failed";

expect.extend({
  toBeValidApiResponse(received: ApiResponse<any>) {
    const hasData = received.hasOwnProperty("data");
    const hasNoErrors = !received.errors;
    return {
      message: () =>
        `expected ${JSON.stringify(
          received
        )} to be a valid API response with data and no errors`,
      pass: hasData && hasNoErrors,
    };
  },

  toHaveErrorType(received: ApiError, type: ApiErrorType) {
    const hasType = received.type === type;
    return {
      message: () =>
        `expected error to have type ${type}, but got ${received.type}`,
      pass: hasType,
    };
  },

  toBeInSliceState(received: SliceStatus, expected: SliceStatus) {
    const isInState = received === expected;
    return {
      message: () =>
        `expected slice to be in state ${expected}, but got ${received}`,
      pass: isInState,
    };
  },

  toHaveValidPagination(
    received: ApiResponse<any>,
    { hasMore, cursor }: { hasMore: boolean; cursor?: string }
  ) {
    const hasPagination = received.pagination !== undefined;
    const hasCorrectMore = received.pagination?.hasMore === hasMore;
    const hasCorrectCursor = cursor
      ? received.pagination?.nextCursor === cursor
      : true;

    return {
      message: () =>
        `expected response to have valid pagination with hasMore: ${hasMore}${
          cursor ? ` and cursor: ${cursor}` : ""
        }`,
      pass: hasPagination && hasCorrectMore && hasCorrectCursor,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
      toHaveErrorType(type: ApiErrorType): R;
      toBeInSliceState(state: SliceStatus): R;
      toHaveValidPagination(options: { hasMore: boolean; cursor?: string }): R;
    }
  }
}
