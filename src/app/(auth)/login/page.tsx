"use client";

import React, { useState, useEffect } from "react";
import AuthLayout from "../layout";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage: React.FC = () => {
  const { loginUser, isLoading, error, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const { email, password } = formData;

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      router.push(redirectPath);
    }
  }, [isAuthenticated, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginUser({ email, password });
    } catch (err) {
      // Error is already handled by the auth slice
      console.error("Login failed:", err);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-h2 text-primary-dark dark:text-primary-light text-center mb-8">
        Welcome back
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
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
            disabled={isLoading}
            variant="filled"
            fullWidth
            startIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

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
            disabled={isLoading}
            variant="filled"
            fullWidth
            startIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="btn-primary"
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{" "}
        <a
          href="/register"
          className="text-primary hover:text-primary-dark dark:hover:text-primary-light"
        >
          Create one
        </a>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
