'use client'
import React, { useState, useEffect } from 'react';
import AuthLayout from '../layout';
import useAuth from '../../../hooks/useAuth';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { useRouter } from 'next/navigation';

const LoginPage: React.FC = () => {
  const { login, isLoading, isError, message, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();
  const { email, password } = formData;

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center">Login to Your Account</h2>
      {isError && <div className="text-red-500 text-center">{message}</div>}
      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={onChange}
              label="Email address"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={onChange}
              label="Password"
            />
          </div>
        </div>

        <div>
          <Button 
            type="submit" 
            className={`w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center">
        Don't have an account?{' '}
        <a href="/auth/register" className="text-blue-600 hover:underline">
          Register here
        </a>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;