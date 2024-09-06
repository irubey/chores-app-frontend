import React from 'react';
import Link from 'next/link';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center">
      <main className="flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Welcome to ChoresApp</h1>
          <p className="text-center text-gray-600 mb-6">
            Simplify household chore management and collaboration
          </p>
          <OAuthButtons />
          <div className="mt-6 text-center">
            <p className="text-gray-600">New to ChoresApp?</p>
            <Link href="/create-household" className="text-blue-500 hover:underline">
              Create a new household
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
