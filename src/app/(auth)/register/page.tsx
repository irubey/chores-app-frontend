"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/UserContext";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors/apiErrors";

const RegisterPage: React.FC = () => {
  const { user, status, error: authError, register } = useAuth();
  const isLoading = status === "loading";
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Redirect if already authenticated
    if (status === "authenticated" && user) {
      const redirectPath =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      router.replace(redirectPath);
    }
  }, [status, user, router]);

  const validateForm = () => {
    const errors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }

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
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("Attempting registration", { email: formData.email });

    if (!validateForm()) return;

    try {
      await register(formData.email, formData.password, formData.name);
      // Registration successful - auth context will handle redirect
    } catch (err) {
      logger.error("Registration failed", { error: err });
      if (err instanceof ApiError) {
        // Handle specific API errors
        if (err.data?.code === "EMAIL_TAKEN") {
          setFormErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }));
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-h3 text-primary-dark dark:text-primary-light">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Join roomies to manage your shared household
        </p>
      </div>

      {authError && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
          {authError.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Full Name"
          value={formData.name}
          onChange={onChange}
          error={formErrors.name}
          disabled={isLoading}
          variant="filled"
          fullWidth
        />

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
          autoComplete="new-password"
          required
          placeholder="Password"
          value={formData.password}
          onChange={onChange}
          error={formErrors.password}
          disabled={isLoading}
          variant="filled"
          fullWidth
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={onChange}
          error={formErrors.confirmPassword}
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
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-dark dark:hover:text-primary-light"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
