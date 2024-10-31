"use client";
import React, { useState } from "react";
import AuthLayout from "../layout";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const { registerUser, isLoading, error } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      router.replace("/dashboard");
    } catch (err) {
      // Error handling is managed by the auth slice
      console.error("Registration failed:", err);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-h2 text-primary-dark dark:text-primary-light text-center mb-8">
        Create your account
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Full Name"
            value={formData.name}
            onChange={onChange}
            label="Full Name"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            className="bg-white dark:bg-background-dark border-neutral-200 dark:border-neutral-700"
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
            className="bg-white dark:bg-background-dark border-neutral-200 dark:border-neutral-700"
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
            className="bg-white dark:bg-background-dark border-neutral-200 dark:border-neutral-700"
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
          Create Account
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-primary hover:text-primary-dark dark:hover:text-primary-light"
          >
            Sign in
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
