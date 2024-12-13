"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logger } from "@/lib/api/logger";
import { useAuthStatus, useIsAuthenticated } from "@/contexts/UserContext";
import { useUser } from "@/hooks/users/useUser";
import { useHouseholds } from "@/hooks/households/useHouseholds";
import { SocketProvider } from "@/contexts/SocketContext";
import Header from "./Header";
import HouseholdSelector from "../household/HouseholdSelector";
import Footer from "./Footer";
import Spinner from "../common/Spinner";

// Public routes that don't require authentication
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
  const isAuthenticated = useIsAuthenticated();
  const { data: userData } = useUser();
  const { data: householdsData, isLoading: isLoadingHouseholds } =
    useHouseholds();
  const { status } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  // Memoize isPublicRoute check
  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]),
    [pathname]
  );

  // Memoize auth state
  const authState = useMemo(
    () => ({
      isLoading: status === "loading",
      isError: status === "error",
      isReady: status === "authenticated" || status === "unauthenticated",
    }),
    [status]
  );

  // Handle auth redirects
  useEffect(() => {
    if (authState.isReady) {
      if (!isPublicRoute && !isAuthenticated) {
        logger.debug("Redirecting to login", {
          pathname,
          status,
          isAuthenticated,
        });
        router.push("/login");
      } else if (isPublicRoute && isAuthenticated) {
        logger.debug("Redirecting to dashboard", {
          pathname,
          status,
          isAuthenticated,
        });
        router.push("/dashboard");
      }
    }
  }, [
    authState.isReady,
    isPublicRoute,
    isAuthenticated,
    router,
    pathname,
    status,
  ]);

  // Show loading spinner during auth check
  if (authState.isLoading || (!authState.isReady && !isPublicRoute)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Show error state if auth failed and not on public route
  if (authState.isError && !isPublicRoute) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-red-600">
          Authentication Error
        </p>
        <button
          onClick={() => router.push("/login")}
          className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Return to Login
        </button>
      </div>
    );
  }

  const content = (
    <div className="flex min-h-screen flex-col">
      <Header user={userData?.data} />
      {isAuthenticated && (
        <HouseholdSelector
          households={householdsData?.data}
          isLoading={isLoadingHouseholds}
        />
      )}
      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );

  // Only wrap with SocketProvider when authenticated
  return isAuthenticated ? (
    <SocketProvider isAuthenticated={isAuthenticated} user={userData?.data}>
      {content}
    </SocketProvider>
  ) : (
    content
  );
}
