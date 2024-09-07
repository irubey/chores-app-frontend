'use client';

import React from 'react';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useTheme } from '@/contexts/ThemeContext';
import TestConnection from '@/components/tests/TestConnection';
export default function LoginPage() {
  const { primaryColor, backgroundColor, textColor } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-${backgroundColor} p-4`}>
      <TestConnection />
      <div className="w-full max-w-md">
        <h1 className={`font-heading text-4xl font-bold text-center text-${primaryColor} mb-6`}>
          ChoresApp
        </h1>
        <p className={`text-center text-${textColor} mb-8 text-lg`}>
          Simplify household chore management and collaboration
        </p>
        <div className="card mb-8">
          <OAuthButtons />
        </div>
        <p className={`text-center text-${textColor} text-sm`}>
          By logging in, you agree to our{' '}
          <a href="/terms" className={`text-${primaryColor} hover:underline`}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className={`text-${primaryColor} hover:underline`}>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
