/**
 * Generates a unique ID for test data
 * @param prefix - The entity type prefix (e.g., "user", "thread")
 * @param index - Optional numeric index for sequential IDs
 */
export function generateId(prefix: string, index?: number): string {
  if (index !== undefined) {
    return `${prefix}-${index}`;
  }
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
