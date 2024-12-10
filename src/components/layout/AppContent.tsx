"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logger } from "@/lib/api/logger";
import { useAuth, useAuthUser, useAuthStatus } from "@/contexts/UserContext";
import { SocketProvider } from "@/contexts/SocketContext";
import Header from "./Header";
import Footer from "./Footer";
import Spinner from "../common/Spinner";

// Define public routes as a const to prevent recreation
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
] as const;

interface AppContentProps {
  children: React.ReactNode;
}

export default function AppContent({ children }: AppContentProps) {
  const { isAuthenticated } = useAuth();
  const user = useAuthUser();
  const { status: authStatus } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();
  const mountCountRef = useRef(0);
  const isInitialMount = useRef(true);

  // Memoize isPublicRoute check
  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]),
    [pathname]
  );

  // Memoize auth state to prevent unnecessary re-renders
  const authState = useMemo(
    () => ({
      isInitializing: authStatus === "loading" || authStatus === "idle",
      isInitialized:
        authStatus === "authenticated" ||
        authStatus === "unauthenticated" ||
        (authStatus === "error" && isPublicRoute),
    }),
    [authStatus, isPublicRoute]
  );

  // Log component mount/unmount only in development and not during Strict Mode remounts
  useEffect(() => {
    if (isInitialMount.current) {
      mountCountRef.current += 1;
      if (process.env.NODE_ENV === "development") {
        logger.debug("AppContent mounted", {
          pathname,
          isPublicRoute,
          mountCount: mountCountRef.current,
        });
      }
      isInitialMount.current = false;
    }

    return () => {
      if (process.env.NODE_ENV === "development") {
        logger.debug("AppContent unmounting", {
          pathname,
          isPublicRoute,
          mountCount: mountCountRef.current,
        });
      }
      mountCountRef.current -= 1;
    };
  }, [pathname, isPublicRoute]);

  // Handle auth state and routing
  useEffect(() => {
    if (!authState.isInitializing && !authState.isInitialized) {
      if (!isPublicRoute && !isAuthenticated) {
        logger.debug("Redirecting to login", {
          pathname,
          authStatus,
          isAuthenticated,
        });
        router.push("/login");
      } else if (isPublicRoute && isAuthenticated) {
        logger.debug("Redirecting to dashboard", {
          pathname,
          authStatus,
          isAuthenticated,
        });
        router.push("/dashboard");
      }
    }
  }, [
    authState.isInitializing,
    authState.isInitialized,
    isPublicRoute,
    isAuthenticated,
    router,
    pathname,
    authStatus,
  ]);

  // Show loading spinner during initial auth check
  if (authState.isInitializing || !authState.isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  const content = (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );

  // Only wrap with SocketProvider when authenticated
  return isAuthenticated ? (
    <SocketProvider isAuthenticated={isAuthenticated} user={user}>
      {content}
    </SocketProvider>
  ) : (
    content
  );
}
