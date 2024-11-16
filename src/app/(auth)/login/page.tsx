"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/api/logger";

const LoginPage: React.FC = () => {
  const { loginUser, isLoading, error, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      logger.info("Redirecting authenticated user", { redirectPath });
      router.push(redirectPath);
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const errors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("Attempting login", { email: formData.email });

    if (!validateForm()) return;

    try {
      await loginUser(formData);
    } catch (err) {
      logger.error("Login failed", { error: err });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-h3 text-primary-dark dark:text-primary-light">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          value={formData.email}
          onChange={onChange}
          error={formErrors.email}
          disabled={isLoading}
          variant="filled"
          fullWidth
        />

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password"
          value={formData.password}
          onChange={onChange}
          error={formErrors.password}
          disabled={isLoading}
          variant="filled"
          fullWidth
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <div className="text-center space-y-4">
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:text-primary-dark dark:hover:text-primary-light"
        >
          Forgot your password?
        </Link>

        <p className="text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary-dark dark:hover:text-primary-light"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
