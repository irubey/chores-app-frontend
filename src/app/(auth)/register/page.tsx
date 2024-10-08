"use client";
import React, { useState } from "react";
import AuthLayout from "../layout";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";

const RegisterPage: React.FC = () => {
  const { registerUser, isLoading, isError, message } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { name, email, password } = formData;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerUser(email, password, name);
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center">
        Create a New Account
      </h2>
      {isError && <div className="text-red-500 text-center">{message}</div>}
      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="name" className="sr-only">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Full Name"
              value={name}
              onChange={onChange}
              label="Full Name"
            />
          </div>
          <div className="mt-4">
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
              autoComplete="new-password"
              required
              placeholder="Password"
              value={password}
              onChange={onChange}
              label="Password"
            />
          </div>
        </div>

        <div>
          <Button type="submit" isLoading={isLoading} fullWidth>
            Register
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
