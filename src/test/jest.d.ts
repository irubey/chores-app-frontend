import type { jest } from "@jest/globals";

declare global {
  const jest: typeof jest;
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockResolvedValue: (value: T) => Mock<T, Y>;
      mockRejectedValue: (value: any) => Mock<T, Y>;
      mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
    }
  }

  // Add missing Jest matchers
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}

export {};
