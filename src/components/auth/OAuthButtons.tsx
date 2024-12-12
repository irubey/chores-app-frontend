'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/utils/api';

// Add this interface to define the expected response structure
interface DevLoginResponse {
  token: string;
  user: any; // You might want to define a more specific user type
}

type OAuthProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'DEV';

const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const OAuthButtons: React.FC = () => {
  const router = useRouter();
  const { primaryColor } = useTheme();

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      if (provider === 'DEV' && IS_DEVELOPMENT) {
        const response = await api.post<DevLoginResponse>('/api/auth/dev-login', {});
        if (response.token) {
          localStorage.setItem('token', response.token);
          // Update user state in your AuthContext
          // authContext.setUser(response.user);
          router.push('/dashboard');
        } else {
          console.error('No token provided for dev login');
        }
      } else {
        const response: { redirect_url: string } = await api.post('/api/auth/login', { provider: provider.toLowerCase() });
        if (response.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          console.error('No redirect URL provided');
        }
      }
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
      {IS_DEVELOPMENT && (
        <button 
          onClick={() => handleOAuthLogin('DEV')}
          className={`btn flex items-center justify-center bg-gray-500 text-white hover:bg-gray-600`}
        >
          <span>Dev Login</span>
        </button>
      )}
    </div>
  );
};

export default OAuthButtons;
