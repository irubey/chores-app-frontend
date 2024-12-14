export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(path as (typeof PUBLIC_ROUTES)[number]);
}

export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path as (typeof AUTH_ROUTES)[number]);
}
