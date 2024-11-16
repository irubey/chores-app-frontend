"use client";

import React from "react";
import { ReactNode } from "react";
import Head from "next/head";
import { logger } from "@/lib/api/logger";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  logger.debug("Rendering auth layout");

  return (
    <>
      <Head>
        <title>roomies | Login</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-h2 font-bold text-primary-dark dark:text-primary-light">
              roomies
            </h1>
            <p className="mt-2 text-text-secondary">
              Manage your shared household with ease
            </p>
          </div>

          <div className="bg-white dark:bg-background-dark rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 p-8">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
