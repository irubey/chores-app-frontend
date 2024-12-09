"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Spinner from "../components/common/Spinner";
import { useRouter, usePathname } from "next/navigation";
import "../styles/globals.css";
import { User, HouseholdWithMembers } from "@shared/types";
import { logger } from "@/lib/api/logger";
import {
  AuthProvider,
  useAuth,
  useAuthUser,
  useAuthStatus,
  useAuthActions,
} from "@/contexts/UserContext";
import { Provider } from "react-redux";
import store from "../store/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query/queryClient";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

const isLoadingStatus = (status: AuthStatus): boolean =>
  status === "loading" || status === "idle";

const isStableStatus = (status: AuthStatus): boolean =>
  status === "authenticated" ||
  status === "unauthenticated" ||
  status === "error";

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

interface WithUserProp {
  user?: User;
  selectedHouseholds?: HouseholdWithMembers[];
}

function AppContent({ children }: AppContentProps) {
  const { isAuthenticated } = useAuth();
  const user = useAuthUser();
  const { status: authStatus, error } = useAuthStatus();
  const { refreshAuthState } = useAuthActions();

  const router = useRouter();
  const pathname = usePathname();
  const initialLoadRef = useRef(true);

  // Memoize isPublicRoute check
  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]),
    [pathname]
  );

  // Memoize auth state to prevent unnecessary re-renders
  const authState = useMemo(
    () => ({
      isInitializing: isLoadingStatus(authStatus),
      isInitialized:
        authStatus === "authenticated" || (!isAuthenticated && isPublicRoute),
    }),
    [authStatus, isAuthenticated, isPublicRoute]
  );

  // Log auth state changes
  useEffect(() => {
    logger.debug("Auth state changed", {
      status: authStatus,
      isAuthenticated,
      isPublicRoute,
      pathname,
      isInitializing: authState.isInitializing,
      isInitialized: authState.isInitialized,
    });
  }, [authStatus, isAuthenticated, isPublicRoute, pathname, authState]);

  // Log component mount/unmount
  useEffect(() => {
    logger.debug("AppContent mounted", {
      pathname,
      isPublicRoute,
    });

    return () => {
      logger.debug("AppContent unmounting", {
        pathname,
        isPublicRoute,
      });
    };
  }, [pathname, isPublicRoute]);

  // Handle routing effects
  useEffect(() => {
    // Skip effect during initial load of protected routes
    if (initialLoadRef.current && !isPublicRoute) {
      return;
    }

    // Skip redirect if still loading or idle
    if (isLoadingStatus(authStatus)) {
      return;
    }

    // Update initial load ref after initialization completes
    if (initialLoadRef.current && authState.isInitialized) {
      initialLoadRef.current = false;
    }

    // Only redirect if:
    // 1. Unauthenticated and trying to access protected route
    // 2. Authenticated and trying to access root
    // 3. In a stable state (not loading/idle)
    const shouldRedirect =
      (!isAuthenticated && !isPublicRoute) ||
      (isAuthenticated && pathname === "/");

    if (shouldRedirect && isStableStatus(authStatus)) {
      const redirectPath = !isAuthenticated
        ? "/login?from=redirect"
        : "/dashboard?from=redirect";

      logger.info("Navigation redirect", {
        from: pathname,
        to: redirectPath,
        reason: !isAuthenticated ? "unauthenticated" : "authenticated",
      });

      router.replace(redirectPath);
    }
  }, [isAuthenticated, pathname, isPublicRoute, router, authStatus, authState]);

  // Show loading state while initializing
  if (authState.isInitializing || !authState.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Render error state if there's an error and we're not redirecting
  if (error && isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-text-secondary">{error.message}</p>
          <button
            onClick={() => refreshAuthState()}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render main layout
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      {(isPublicRoute || isAuthenticated) && <Header user={user} />}
      <main className="flex-grow container-custom py-8 space-y-6">
        {!isPublicRoute && !isAuthenticated ? null : children}
      </main>
      {isAuthenticated && <Footer />}
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let isDark = false;
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark') {
                  isDark = true;
                } else if (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  isDark = true;
                }
                if (isDark) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full antialiased font-sans">
        <ErrorBoundary>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <ThemeProvider>
                  <AppContent>{children}</AppContent>
                </ThemeProvider>
              </AuthProvider>
            </QueryClientProvider>
          </Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
