"use client";

import React, { useState, useEffect } from "react";
import { useAuthActions, useAuthStatus } from "@/contexts/UserContext";
import { useUser } from "@/hooks/users/useUser";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors/apiErrors";
import { FaEnvelope, FaLock, FaExclamationCircle } from "react-icons/fa";

const LoginPage: React.FC = () => {
  const { data: userData } = useUser();
  const { login } = useAuthActions();
  const { status, error: authError } = useAuthStatus();
  const isLoading = status === "loading";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (userData?.data) {
      const redirectPath =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      logger.info("Redirecting authenticated user", { redirectPath });
      router.push(redirectPath);
    }
  }, [userData?.data, router]);

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
    setFormError(null); // Clear previous errors

    if (!validateForm()) return;

    try {
      const { email, password } = formData;
      await login(email, password);
    } catch (err) {
      logger.error("Login failed", {
        error:
          err instanceof ApiError
            ? {
                type: err.type,
                status: err.status,
                message: err.message,
                details: err.data,
              }
            : "Unknown error",
      });

      if (err instanceof ApiError) {
        switch (err.status) {
          case 401:
            setFormError("Invalid email or password. Please try again.");
            break;
          case 400:
            setFormError("Please check your input and try again.");
            break;
          case 429:
            setFormError("Too many login attempts. Please try again later.");
            break;
          case 500:
            setFormError("Server error. Please try again later.");
            break;
          default:
            setFormError("An error occurred. Please try again.");
        }
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-h3 text-primary-dark dark:text-primary-light">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to your account
            </p>
          </div>

          {(authError || formError) && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm animate-fade-in flex items-center gap-2">
              <div className="shrink-0">
                <FaExclamationCircle className="h-5 w-5" />
              </div>
              <div>
                {formError || authError?.message}
                {authError?.code === "RATE_LIMIT" && (
                  <p className="mt-1 text-xs">
                    Please wait a few minutes before trying again.
                  </p>
                )}
              </div>
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
              startIcon={<FaEnvelope />}
              label="Email"
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
              startIcon={<FaLock />}
              label="Password"
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
      </Card>
    </div>
  );
};

export default LoginPage;
