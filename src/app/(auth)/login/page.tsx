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
      <h2 className="text-2xl font-semibold text-center mb-8">
        Login to Your Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
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
            />
          </div>

          <div>
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
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary-dark transition-colors"
            prefetch={false}
          >
            Register here
          </Link>
        </p>
        <p className="text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary-dark transition-colors"
            prefetch={false}
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
