import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";

export { jest, describe, beforeEach, afterEach, it, expect };

// Add any custom global test utilities here
export const waitForNextTick = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const mockConsoleError = () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });
};

export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.warn = originalWarn;
  });
};
