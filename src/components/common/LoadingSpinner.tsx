'use client'

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const LoadingSpinner: React.FC = () => {
  const { isLoading } = useAuth();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 z-50">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
};

export default LoadingSpinner;
