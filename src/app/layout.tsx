"use client";

import React from "react";
import { Provider } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SocketProvider } from "../contexts/SocketContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import store from "../store/store";
import "../styles/globals.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useRouter, usePathname } from "next/navigation";
import Head from "next/head";

function AppContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, status, initAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define routes where auth is NOT required
  const publicRoutes = ["/login", "/register", "/"];

  React.useEffect(() => {
    if (status === "idle") {
      initAuth();
    }
  }, [status, initAuth]);

  React.useEffect(() => {
    // After auth initialization, handle redirection
    if (status === "succeeded") {
      if (!publicRoutes.includes(pathname) && !isAuthenticated) {
        router.push("/login");
      } else if (
        publicRoutes.includes(pathname) &&
        isAuthenticated &&
        pathname !== "/dashboard"
      ) {
        // Redirect authenticated users away from public pages like login/register
        router.push("/dashboard");
      }
    }
  }, [status, isAuthenticated, router, pathname]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If the route is public or the user is authenticated, render children
  // Otherwise, render nothing as the redirect will handle navigation
  return (
    <ThemeProvider>
      <SocketProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex flex-1">
            <main className="flex-1 p-4">{children}</main>
          </div>
          <Footer />
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
        {/* Inline Script for Early Theme Initialization */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const storedTheme = window.localStorage.getItem('theme');
                  if (storedTheme === 'light' || storedTheme === 'dark') {
                    return storedTheme;
                  }
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  return prefersDark ? 'dark' : 'light';
                }
                const theme = getInitialTheme();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
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
