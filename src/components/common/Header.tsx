import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "../../types/auth";

interface HeaderProps {
  user?: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-background-dark border-b border-neutral-200 dark:border-neutral-700">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-heading font-semibold text-primary dark:text-primary-light">
                RoommatePro
              </span>
            </Link>
          </div>

          {/* Navigation Links - Show only if authenticated */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-text-primary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/messages"
                className="text-text-primary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Messages
              </Link>
              <Link
                href="/expenses"
                className="text-text-primary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Expenses
              </Link>
              <Link
                href="/chores"
                className="text-text-primary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Chores
              </Link>
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-4">
              <button className="btn-icon">
                <span className="sr-only">Notifications</span>
                {/* Bell Icon */}
                <svg
                  className="w-5 h-5 text-text-primary dark:text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <button className="btn-icon">
                <Image
                  src={user.avatar || "/default-avatar.png"}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-outline-primary">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
