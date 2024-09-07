'use client'

import React, { useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show a loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // This return is just a fallback, the useEffect should handle the redirection
  return null;
}

