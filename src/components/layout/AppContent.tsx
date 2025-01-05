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
import { isPublicRoute } from "@/lib/constants/routes";

interface AppContentProps {
  children: React.ReactNode;
}

export default function AppContent({ children }: AppContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const { status } = useAuthStatus();
  const { data: userData } = useUser();
  const { data: householdsData, isLoading: isLoadingHouseholds } =
    useHouseholds();

  // Memoize auth state to prevent unnecessary re-renders
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
    if (!authState.isReady) return;

    const currentIsPublic = isPublicRoute(pathname);
    const shouldRedirectToLogin = !currentIsPublic && !isAuthenticated;
    const shouldRedirectToDashboard = currentIsPublic && isAuthenticated;

    if (shouldRedirectToLogin || shouldRedirectToDashboard) {
      const targetPath = shouldRedirectToLogin ? "/login" : "/dashboard";
      const redirectType = shouldRedirectToLogin ? "login" : "dashboard";

      logger.debug(`Redirecting to ${redirectType}`, {
        from: pathname,
        to: targetPath,
        status,
        isAuthenticated,
      });

      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        router.push(targetPath);
      }, 0);
    }
  }, [authState.isReady, isAuthenticated, pathname, router, status]);

  // Memoize content to prevent unnecessary re-renders
  const content = useMemo(
    () => (
      <div className="flex min-h-screen flex-col">
        <Header user={userData?.data} />
        {isAuthenticated && (
          <HouseholdSelector
            households={householdsData?.data}
            isLoading={isLoadingHouseholds}
            activeHouseholdId={userData?.data?.activeHouseholdId}
          />
        )}
        <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
        <Footer />
      </div>
    ),
    [
      userData?.data,
      isAuthenticated,
      householdsData?.data,
      isLoadingHouseholds,
      children,
    ]
  );

  // Show loading spinner during auth check
  if (authState.isLoading || (!authState.isReady && !isPublicRoute(pathname))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Show error state if auth failed and not on public route
  if (authState.isError && !isPublicRoute(pathname)) {
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

  // Return wrapped content based on auth state
  return isAuthenticated ? (
    <SocketProvider isAuthenticated={isAuthenticated} user={userData?.data}>
      {content}
    </SocketProvider>
  ) : (
    content
  );
}
