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
import { ApiError } from "@/lib/api/errors";
import { UserProvider } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { HouseholdsProvider } from "@/contexts/HouseholdsContext";
import { Provider } from "react-redux";
import store from "../store/store";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Define public routes
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
  const {
    isAuthenticated,
    isLoading: authLoading,
    status: authStatus,
    user,
    error: authError,
    initAuth,
  } = useAuth();

  const {
    selectedHouseholds,
    isLoading: householdLoading,
    error: householdError,
    status: householdStatus,
  } = useHousehold();

  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(
    pathname as (typeof PUBLIC_ROUTES)[number]
  );
  const initialLoadRef = useRef(true);

  // Check if contexts are still initializing
  const isInitializing =
    authStatus === "loading" ||
    (isAuthenticated && !isPublicRoute && householdStatus.list === "loading");

  // Check if initialization completed successfully
  const isInitialized =
    authStatus === "authenticated" &&
    (!isAuthenticated || isPublicRoute || householdStatus.list === "succeeded");

  // Always memoize childProps to avoid unnecessary re-renders
  const childProps = useMemo(
    () => ({
      user,
      selectedHouseholds,
    }),
    [user, selectedHouseholds]
  );

  // Always memoize enhanced children
  const enhancedChildren = useMemo(() => {
    return React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(
            child as React.ReactElement<WithUserProp>,
            childProps
          )
        : child
    );
  }, [children, childProps]);

  // Handle routing effects
  useEffect(() => {
    // Always show loading on first render of protected routes
    if (initialLoadRef.current && !isPublicRoute) {
      logger.debug("Initial load of protected route", {
        pathname,
        isPublicRoute,
        authStatus,
        householdStatus,
        isAuthenticated,
        isInitializing,
        isInitialized,
      });
      return;
    }

    // Don't redirect while initializing
    if (isInitializing) {
      logger.debug("Skipping redirect - still initializing", {
        authStatus,
        householdStatus,
        isAuthenticated,
        pathname,
        isInitializing,
        isInitialized,
      });
      return;
    }

    // Update initial load ref after initialization completes
    if (initialLoadRef.current && isInitialized) {
      logger.debug("Initialization completed", {
        pathname,
        authStatus,
        householdStatus,
        isAuthenticated,
        isInitializing,
        isInitialized,
      });
      initialLoadRef.current = false;
    }

    const shouldRedirect =
      (!isAuthenticated && !isPublicRoute) ||
      (isAuthenticated && pathname === "/");

    if (shouldRedirect) {
      const redirectPath = !isAuthenticated
        ? "/login?from=redirect"
        : "/dashboard?from=redirect";
      logger.info("Route redirect", {
        from: pathname,
        to: redirectPath,
        isAuthenticated,
        isPublicRoute,
        authStatus,
        householdStatus,
        isInitializing,
        isInitialized,
      });
      router.replace(redirectPath);
    } else {
      logger.debug("No redirect needed", {
        pathname,
        isAuthenticated,
        isPublicRoute,
        authStatus,
        householdStatus,
        isInitializing,
        isInitialized,
      });
    }
  }, [
    isAuthenticated,
    pathname,
    isPublicRoute,
    router,
    authStatus,
    householdStatus,
    isInitializing,
    isInitialized,
  ]);

  // Handle auth initialization errors
  useEffect(() => {
    if (authError) {
      logger.error("Auth error in layout", {
        authError,
        pathname,
        isPublicRoute,
        authStatus,
        householdStatus,
        isAuthenticated,
        isInitializing,
        isInitialized,
      });
      if (!isPublicRoute) {
        router.replace("/login?error=auth");
      }
    }
  }, [
    authError,
    isPublicRoute,
    router,
    pathname,
    authStatus,
    householdStatus,
    isAuthenticated,
    isInitializing,
    isInitialized,
  ]);

  // Handle household errors
  useEffect(() => {
    if (householdError) {
      logger.error("Household error in layout", {
        householdError,
        pathname,
        isPublicRoute,
        authStatus,
        householdStatus,
        isAuthenticated,
        isInitializing,
        isInitialized,
      });
      // Handle based on error type
      if (householdError === "UNAUTHORIZED") {
        router.replace("/login?error=session");
      }
    }
  }, [
    householdError,
    router,
    pathname,
    authStatus,
    householdStatus,
    isAuthenticated,
    isInitializing,
    isInitialized,
  ]);

  // Show loading state while initializing
  if (isInitializing || !isInitialized) {
    logger.debug("Showing loading state", {
      initialLoad: initialLoadRef.current,
      authStatus,
      householdStatus,
      isAuthenticated,
      isPublicRoute,
      pathname,
      isInitializing,
      isInitialized,
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Render error state if there's an error and we're not redirecting
  if ((authError || householdError) && isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-text-secondary">{authError || householdError}</p>
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
              <HouseholdsProvider>
                <ThemeProvider>
                  <AppContent>{children}</AppContent>
                </ThemeProvider>
              </HouseholdsProvider>
            </UserProvider>
          </Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
