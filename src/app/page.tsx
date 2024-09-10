'use client'

import React from "react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { primaryColor, backgroundColor, textColor } = useTheme();

  // React.useEffect(() => {
  //   if (!isLoading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // if (!user) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-${backgroundColor} p-4`}>
        <h1 className={`font-heading text-4xl font-bold text-center text-${primaryColor} mb-6`}>
          Welcome to ChoresApp
        </h1>
        <p className={`text-center text-${textColor} mb-8 max-w-2xl`}>
          Simplify your household chore management and collaboration. ChoresApp helps you and your roommates fairly distribute tasks, track progress, and maintain a harmonious living environment.
        </p>
        <ul className={`text-${textColor} mb-8 max-w-xl`}>
          <li className="mb-2">✅ Collaborative household setup</li>
          <li className="mb-2">✅ Fair chore distribution based on preferences</li>
          <li className="mb-2">✅ Real-time notifications and updates</li>
          <li className="mb-2">✅ Calendar integration for easy scheduling</li>
        </ul>
        <Link href="/login" className={`btn btn-primary text-lg`}>
          Get Started
        </Link>
      </div>
    );
  }

  // return null;
// }

