'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/utils/api';

type OAuthProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

const OAuthButtons: React.FC = () => {
  const router = useRouter();
  const { primaryColor } = useTheme();

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      const data = await api.post('/api/auth/login', { provider });
      router.push(data.redirect_url);
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <button 
        onClick={() => handleOAuthLogin('GOOGLE')}
        className={`btn flex items-center justify-center bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
      >
        <Image src="/icons/google-icon.png" alt="Google" width={20} height={20} className="mr-2" />
        <span>Continue with Google</span>
      </button>
      <button 
        onClick={() => handleOAuthLogin('FACEBOOK')}
        className={`btn flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700`}
      >
        <Image src="/icons/facebook-icon.png" alt="Facebook" width={20} height={20} className="mr-2" />
        <span>Continue with Facebook</span>
      </button>
      <button 
        onClick={() => handleOAuthLogin('APPLE')}
        className={`btn flex items-center justify-center bg-black text-white hover:bg-gray-900`}
      >
        <Image src="/icons/apple-icon.png" alt="Apple" width={20} height={20} className="mr-2" />
        <span>Continue with Apple</span>
      </button>
    </div>
  );
};

export default OAuthButtons;
