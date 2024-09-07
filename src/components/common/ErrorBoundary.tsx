'use client'

import React from 'react';
import { useErrorBoundary } from "use-error-boundary";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary();

  return (
    <ErrorBoundary
      render={() => (
        didCatch ? (
          <div role="alert">
            <p>An error occurred:</p>
            <pre>{error.message}</pre>
            {fallback}
          </div>
        ) : (
          children
        )
      )}
    />
  );
};

export default ErrorBoundary;
