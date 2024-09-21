// Utility functions for the Household Management App frontend

/**
 * Formats a Date object into a readable string.
 * Uses Intl.DateTimeFormat for localization.
 * 
 * @param date - The date to format.
 * @param options - Formatting options.
 * @returns Formatted date string.
 */
export const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  }
): string => {
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - The string to capitalize.
 * @returns Capitalized string.
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Creates a debounced version of the provided function.
 * The function will be called after the specified wait time has elapsed
 * since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce.
 * @param wait - The debounce delay in milliseconds.
 * @returns Debounced function.
 */
export const debounce = <F extends (...args: any[]) => void>(
  func: F, 
  wait: number
): (...args: Parameters<F>) => void => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Creates a throttled version of the provided function.
 * The function will be called at most once every specified interval.
 * 
 * @param func - The function to throttle.
 * @param limit - The throttle interval in milliseconds.
 * @returns Throttled function.
 */
export const throttle = <F extends (...args: any[]) => void>(
  func: F, 
  limit: number
): (...args: Parameters<F>) => void => {
  let inThrottle: boolean = false;
  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Handles API errors uniformly across the application.
 * Can be extended to include logging or user notifications.
 * 
 * @param error - The error object caught from API calls.
 */
export const handleApiError = (error: any): void => {
  if (error.response) {
    // Server responded with a status other than 2xx
    console.error('API Error:', error.response.data);
    // Optionally, display a user-friendly message
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network Error:', error.request);
  } else {
    // Something else caused the error
    console.error('Error:', error.message);
  }
};

/**
 * Generates a UUID using the browser's crypto API.
 * 
 * @returns A UUID string.
 */
export const generateUUID = (): string => {
  return ([1e7] as any+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, 
    (c: any) => (
      c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4
    ).toString(16)
  );
};

/**
 * Checks if a value is null or undefined.
 * 
 * @param value - The value to check.
 * @returns True if the value is null or undefined, otherwise false.
 */
export const isNil = <T>(value: T | null | undefined): value is null | undefined => {
  return value === null || value === undefined;
};

/**
 * Deep clones an object. Useful for creating immutable updates.
 * 
 * @param obj - The object to clone.
 * @returns A deep-cloned copy of the object.
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Safely accesses nested object properties.
 * 
 * @param obj - The object to traverse.
 * @param path - The path to the desired property.
 * @returns The value at the specified path or undefined.
 */
export const getNestedProperty = <T>(
  obj: T, 
  path: Array<keyof any>
): any => {
  return path.reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
};
