'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type OAuthProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

const OAuthButtons: React.FC = () => {
  const router = useRouter();

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth');
      }

      const data = await response.json();
      router.push(data.redirect_url);
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => handleOAuthLogin('GOOGLE')}
        className="w-full bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md flex items-center justify-center hover:bg-gray-50 transition duration-300 ease-in-out"
      >
        <Image src="/google-icon.png" alt="Google" width={20} height={20} className="mr-2" />
        Continue with Google
      </button>
      <button 
        onClick={() => handleOAuthLogin('FACEBOOK')}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-blue-700 transition duration-300 ease-in-out"
      >
        <Image src="/facebook-icon.png" alt="Facebook" width={20} height={20} className="mr-2" />
        Continue with Facebook
      </button>
      <button 
        onClick={() => handleOAuthLogin('APPLE')}
        className="w-full bg-black text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-gray-900 transition duration-300 ease-in-out"
      >
        <Image src="/apple-icon.png" alt="Apple" width={20} height={20} className="mr-2" />
        Continue with Apple
      </button>
    </div>
  );
};

export default OAuthButtons;
