"use client";

import React, { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import store from "../store/store";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useRouter, usePathname } from "next/navigation";
import Head from "next/head";
import { tokenService } from "../lib/api/services/tokenService";
import { reset } from "../store/slices/authSlice";

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

function AppContent({ children }: AppContentProps) {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user, error, initAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(
    pathname as (typeof PUBLIC_ROUTES)[number]
  );

  // Initialize authentication state on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initialize();
    }
  }, [initAuth, isInitialized]);

  // Set up authentication error handler to reset auth state and redirect
  useEffect(() => {
    tokenService.setAuthErrorHandler(() => {
      dispatch(reset());
      router.push("/login");
    });
  }, [dispatch, router]);

  // Handle routing based on authentication state
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const handleRouting = () => {
      if (!isPublicRoute && !isAuthenticated) {
        // Save the attempted route for post-login redirect
        sessionStorage.setItem("redirectAfterLogin", pathname);
        router.push("/login");
      } else if (isPublicRoute && isAuthenticated) {
        // Redirect to saved route or dashboard
        const redirectPath =
          sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath);
      }
    };

    handleRouting();
  }, [
    isAuthenticated,
    isLoading,
    router,
    pathname,
    isPublicRoute,
    isInitialized,
  ]);

  // Show loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state for protected routes
  if (error && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SocketProvider isAuthenticated={isAuthenticated} user={user}>
        <div className="flex flex-col min-h-screen">
          {isAuthenticated && <Header user={user} />}
          <div className="flex flex-1">
            <main className="flex-1 p-4">{children}</main>
          </div>
          {isAuthenticated && <Footer />}
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const storedTheme = window.localStorage.getItem('theme');
                  if (storedTheme === 'light' || storedTheme === 'dark') {
                    return storedTheme;
                  }
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.toggle('dark', getInitialTheme() === 'dark');
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Provider store={store}>
          <AppContent>{children}</AppContent>
        </Provider>
      </body>
    </html>
  );
}
