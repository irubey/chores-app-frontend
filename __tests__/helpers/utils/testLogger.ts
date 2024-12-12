import { logger } from "@/lib/api/logger";

class TestLogger {
  private spies = logger;

  setupTest() {
    // Reset all mocks before each test
    Object.values(this.spies).forEach((spy) => {
      if (typeof spy.mockReset === "function") {
        spy.mockReset();
      }
    });
  }

  // Optional logging methods if you need to log during tests
  debug(message: string, metadata?: Record<string, any>) {
    this.spies.debug(message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.spies.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.spies.warn(message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.spies.error(message, metadata);
  }

  // Assertion methods to verify logging behavior
  assertAPIResponseLogged(status: number) {
    expect(this.spies.logAPIResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status,
      })
    );
  }

  assertAPIErrorLogged(errorType: string) {
    expect(this.spies.logAPIError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: errorType,
      })
    );
  }

  assertAPIRequestLogged(method: string, url: string) {
    expect(this.spies.logAPIRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method,
        url,
      })
    );
  }

  assertLogged(level: "debug" | "info" | "warn" | "error", message: string) {
    const spy = this.spies[level];
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(message),
      expect.anything()
    );
  }
}

export const testLogger = new TestLogger();
