"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { useHousehold } from "../hooks/useHousehold";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import store from "../store/store";
import Spinner from "../components/common/Spinner";
import { useRouter, usePathname } from "next/navigation";
import { reset } from "../store/slices/authSlice";
import "../styles/globals.css";
import { User, HouseholdWithMembers } from "@shared/types";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

// Define public routes
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/",
  "/forgot-password",
  "/reset-password",
] as const;

interface AppContentProps {
  children: React.ReactNode;
}

// Add type for components that can receive user prop
interface WithUserProp {
  user?: User;
  selectedHouseholds?: HouseholdWithMembers[];
}

function AppContent({ children }: AppContentProps) {
  const { isAuthenticated, isLoading, user, error, initAuth, resetAuth } =
    useAuth();
  const { selectedHouseholds, getSelectedHouseholds } = useHousehold();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasInitializedAuth = useRef(false);
  const isPublicRoute = PUBLIC_ROUTES.includes(
    pathname as (typeof PUBLIC_ROUTES)[number]
  );

  useEffect(() => {
    const initialize = async () => {
      if (hasInitializedAuth.current) return;
      hasInitializedAuth.current = true;

      logger.info("Initializing authentication");
      try {
        const user = await initAuth();
        logger.info("Authentication initialized successfully", {
          isAuthenticated: !!user,
        });

        if (
          user &&
          pathname === "/" &&
          !window.location.search.includes("from=redirect")
        ) {
          logger.info("Redirecting authenticated user to dashboard");
          router.replace("/dashboard?from=redirect");
        }
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Auth initialization failed", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Auth initialization failed with unknown error", {
            error,
          });
        }
        resetAuth();
        if (!isPublicRoute) {
          logger.info("Redirecting to login page", { from: pathname });
          router.replace("/login?from=redirect");
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [isPublicRoute, initAuth, router, pathname, resetAuth]);

  // Auth state changes effect
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated && !isPublicRoute) {
        logger.info(
          "Unauthenticated access to protected route - redirecting to login",
          {
            pathname,
            isPublicRoute,
          }
        );
        router.replace("/login?from=redirect");
      } else if (
        isAuthenticated &&
        pathname === "/" &&
        !window.location.search.includes("from=redirect")
      ) {
        logger.info("Authenticated user at root - redirecting to dashboard");
        router.replace("/dashboard?from=redirect");
      }
    }
  }, [isAuthenticated, isInitialized, isPublicRoute, pathname, router]);

  // Selected households effect
  useEffect(() => {
    const fetchSelectedHouseholds = async () => {
      if (isAuthenticated && !selectedHouseholds?.length) {
        logger.info("Fetching selected households for authenticated user");
        try {
          await getSelectedHouseholds();
          logger.debug("Successfully fetched selected households");
        } catch (error) {
          if (error instanceof ApiError) {
            logger.error("Failed to fetch selected households", {
              type: error.type,
              message: error.message,
              status: error.status,
              userId: user?.id,
            });
          } else {
            logger.error(
              "Failed to fetch selected households with unknown error",
              {
                error,
                userId: user?.id,
              }
            );
          }
        }
      }
    };

    fetchSelectedHouseholds();
  }, [
    isAuthenticated,
    getSelectedHouseholds,
    selectedHouseholds?.length,
    user?.id,
  ]);

  if (!isInitialized) {
    logger.debug("Rendering initialization spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  logger.debug("Rendering main layout", {
    isPublicRoute,
    isAuthenticated,
    hasSelectedHouseholds: !!selectedHouseholds?.length,
    pathname,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-text-primary dark:text-text-secondary">
      {isPublicRoute || isAuthenticated ? <Header user={user} /> : null}
      <main className="flex-grow container-custom py-8 space-y-6">
        {!isPublicRoute && !isAuthenticated ? (
          <div className="h-full flex items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<WithUserProp>, {
                  user,
                  selectedHouseholds,
                })
              : child
          )
        )}
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
        <Provider store={store}>
          <ThemeProvider>
            <AppContent>{children}</AppContent>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
