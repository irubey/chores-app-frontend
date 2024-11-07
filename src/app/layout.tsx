"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import store from "../store/store";
import Spinner from "../components/common/Spinner";
import { useRouter, usePathname } from "next/navigation";
import { reset } from "../store/slices/authSlice";
import "../styles/globals.css";
import { User } from "@shared/types";

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
}

function AppContent({ children }: AppContentProps) {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user, error, initAuth } = useAuth();
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

      try {
        await initAuth();
        // After successful auth, redirect from home to dashboard
        if (
          isAuthenticated &&
          pathname === "/" &&
          !window.location.search.includes("from=redirect")
        ) {
          router.replace("/dashboard?from=redirect");
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        dispatch(reset()); // Reset auth state
        if (!isPublicRoute) {
          router.replace("/login?from=redirect");
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [isPublicRoute, initAuth, router, pathname, isAuthenticated, dispatch]);

  // Add effect to handle auth state changes
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated && !isPublicRoute) {
        router.replace("/login?from=redirect");
      } else if (
        isAuthenticated &&
        pathname === "/" &&
        !window.location.search.includes("from=redirect")
      ) {
        router.replace("/dashboard?from=redirect");
      }
    }
  }, [isAuthenticated, isInitialized, isPublicRoute, pathname, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

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
