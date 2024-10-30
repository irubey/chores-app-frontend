"use client";

import React, { useEffect, useState, useRef } from "react";
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
        // Only redirect to login for non-public routes
        if (!isPublicRoute && pathname !== "/login") {
          router.replace("/login?from=redirect");
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [isPublicRoute, initAuth, router, pathname, isAuthenticated]);

  // Add a separate effect for handling authenticated state changes
  useEffect(() => {
    if (
      isInitialized &&
      isAuthenticated &&
      pathname === "/" &&
      !window.location.search.includes("from=redirect")
    ) {
      router.replace("/dashboard?from=redirect");
    }
  }, [isAuthenticated, pathname, router, isInitialized]);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-text-primary font-sans">
      {isPublicRoute || isAuthenticated ? <Header user={user} /> : null}
      <main>{children}</main>
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
