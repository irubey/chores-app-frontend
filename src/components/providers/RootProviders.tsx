"use client";

import React, { Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/UserContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query/queryClient";
import Spinner from "@/components/common/Spinner";

interface RootProvidersProps {
  children: React.ReactNode;
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Spinner size="large" className="m-auto" />}>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </Suspense>
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
