"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Spinner from "../components/common/Spinner";
import { useRouter, usePathname } from "next/navigation";
import "../styles/globals.css";
import { User, HouseholdWithMembers } from "@shared/types";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";
import { UserProvider } from "@/contexts/UserContext";
import { useAuth, UseAuthReturn } from "../hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { HouseholdsProvider } from "@/contexts/HouseholdsContext";
import { Provider } from "react-redux";
import store from "../store/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { requestManager } from "@/lib/api/requestManager";

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

// Use the imported type
type AuthStatus = UseAuthReturn["status"];

function AppContent({ children }: AppContentProps) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    status: authStatus,
    user,
    error: authError,
    initAuth,
  } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  // Memoize isPublicRoute check
  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]),
    [pathname]
  );

  const initialLoadRef = useRef(true);

  // Memoize auth state to prevent unnecessary re-renders
  const authState = useMemo(
    () => ({
      isInitializing: authStatus === "loading",
      isInitialized:
        authStatus === "authenticated" || (!isAuthenticated && isPublicRoute),
    }),
    [authStatus, isAuthenticated, isPublicRoute]
  );

  // Memoize child props
  const childProps = useMemo(
    () => ({
      user,
    }),
    [user]
  );

  // Handle cleanup on route changes
  useEffect(() => {
    logger.debug("Route changed", {
      pathname,
      isPublicRoute,
      authStatus,
      isAuthenticated,
    });

    // Cleanup pending requests on route change
    return () => {
      requestManager.abortAll();
    };
  }, [pathname]);

  // Handle routing effects
  useEffect(() => {
    // Skip effect during initial load of protected routes
    if (initialLoadRef.current && !isPublicRoute) {
      logger.debug("Initial load of protected route", {
        pathname,
        isPublicRoute,
        authStatus,
        isAuthenticated,
        isInitializing: authState.isInitializing,
        isInitialized: authState.isInitialized,
      });
      return;
    }

    // Skip redirect if still loading
    if (authLoading) {
      logger.debug("Skipping redirect - waiting for auth", {
        authStatus,
        isAuthenticated,
        pathname,
      });
      return;
    }

    // Update initial load ref after initialization completes
    if (initialLoadRef.current && authState.isInitialized) {
      logger.debug("Initialization completed", {
        pathname,
        authStatus,
        isAuthenticated,
      });
      initialLoadRef.current = false;
    }

    // Only redirect if:
    // 1. Unauthenticated and trying to access protected route
    // 2. Authenticated and trying to access root
    // 3. Not in loading state
    const shouldRedirect =
      (!isAuthenticated && !isPublicRoute) ||
      (isAuthenticated && pathname === "/");

    if (shouldRedirect && !authLoading) {
      const redirectPath = !isAuthenticated
        ? "/login?from=redirect"
        : "/dashboard?from=redirect";

      logger.info("Route redirect", {
        from: pathname,
        to: redirectPath,
        isAuthenticated,
        isPublicRoute,
        authStatus,
      });

      // Abort any pending requests before redirect
      requestManager.abortAll();
      router.replace(redirectPath);
    }
  }, [isAuthenticated, pathname, isPublicRoute, router, authStatus, authState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug("AppContent unmounting", {
        pathname,
        authStatus,
        isAuthenticated,
      });
      requestManager.abortAll();
    };
  }, []);

  // Memoize the wrapped children to prevent unnecessary provider mounts
  const wrappedChildren = useMemo(() => {
    return <HouseholdsProvider>{children}</HouseholdsProvider>;
  }, [children]);

  // Memoize the enhanced children separately
  const enhancedChildren = useMemo(() => {
    return React.Children.map(wrappedChildren, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(
            child as React.ReactElement<WithUserProp>,
            childProps
          )
        : child
    );
  }, [wrappedChildren, childProps]);

  // Show loading state while initializing
  if (authState.isInitializing || !authState.isInitialized) {
    logger.debug("Showing loading state", {
      initialLoad: initialLoadRef.current,
      authStatus,
      isAuthenticated,
      isPublicRoute,
      pathname,
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Render error state if there's an error and we're not redirecting
  if (authError && isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-text-secondary">{authError}</p>
          <button onClick={() => initAuth()} className="mt-4 btn-primary">
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
        {!isPublicRoute && !isAuthenticated ? null : enhancedChildren}
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
            <UserProvider>
              <ThemeProvider>
                <AppContent>{children}</AppContent>
              </ThemeProvider>
            </UserProvider>
          </Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
