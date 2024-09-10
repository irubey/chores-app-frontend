'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';


const AuthCallback = () => {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    const provider = new URLSearchParams(window.location.search).get('provider') as 'GOOGLE' | 'FACEBOOK' | 'APPLE';
    
    if (token && provider) {
      login(provider, token);
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, []);

  return <div>Processing authentication...</div>;
};

export default AuthCallback;
