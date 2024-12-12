/**
 * Utility to check if a cookie exists without accessing its value
 * Note: Cannot detect HTTP-only cookies directly
 */
export function hasCookie(name: string): boolean {
  return document.cookie
    .split(";")
    .some((item) => item.trim().startsWith(`${name}=`));
}

/**
 * Get all cookie names that exist in the browser
 * Note: Cannot detect HTTP-only cookies
 */
export function getCookieNames(): string[] {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim());
}

/**
 * Check if user has an active auth session by looking for the auth indicator cookie
 * This cookie is set/removed alongside the HTTP-only refresh token
 */
export function hasAuthSession(): boolean {
  return hasCookie("auth_session");
}
