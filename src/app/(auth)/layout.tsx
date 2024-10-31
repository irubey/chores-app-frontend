"use client";

import React from "react";
import { ReactNode } from "react";
import Head from "next/head";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <>
      <Head>
        <title>roomies</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-background-dark rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
