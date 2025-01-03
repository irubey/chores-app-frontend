"use client";
import React from "react";
import Link from "next/link";
import { useUser } from "@/hooks/users/useUser";

const Footer: React.FC = () => {
  const { data: userData } = useUser();
  const user = userData?.data;

  return (
    <footer
      className={`bg-primary dark:bg-primary-dark text-white py-4 mt-auto`}
    >
      <div className="container-custom flex flex-col items-center space-y-2">
        {user ? (
          <>
            <div className="flex space-x-4">
              <Link href="/about" className="hover:text-secondary-light">
                About
              </Link>
              <Link href="/contact" className="hover:text-secondary-light">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-secondary-light">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-secondary-light">
                Privacy Policy
              </Link>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} roomies. All rights reserved.
            </p>
          </>
        ) : (
          <>
            <Link href="/about" className="hover:text-secondary-light">
              About
            </Link>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} roomies. All rights reserved.
            </p>
          </>
        )}
      </div>
    </footer>
  );
};

export default Footer;
