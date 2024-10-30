"use client";
import React from "react";
import Link from "next/link";
import { User } from "@shared/types";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../hooks/useNotifications";
import {
  FaTasks,
  FaMoneyBillWave,
  FaComments,
  FaCalendarAlt,
  FaCog,
  FaSun,
  FaMoon,
} from "react-icons/fa";

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { logoutUser } = useAuth();
  // const { theme, toggleTheme } = useTheme();
  const { notifications } = useNotifications();

  // Helper function to count unseen notifications per feature
  const countUnseen = (type: string) => {
    return notifications.filter(
      (notification) => notification.type === type && !notification.isRead
    ).length;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show an error toast/notification here
    }
  };

  const NavigationLink: React.FC<{
    href: string;
    icon: React.ReactNode;
    label: string;
    notificationType?: string;
  }> = ({ href, icon, label, notificationType }) => (
    <Link
      href={href}
      className="relative flex flex-col items-center hover:text-secondary-light transition-colors duration-200"
    >
      {icon}
      {notificationType && countUnseen(notificationType) > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          {countUnseen(notificationType)}
        </span>
      )}
      <span className="mt-1 text-sm">{label}</span>
    </Link>
  );

  return (
    <header className="bg-primary dark:bg-primary-dark text-white shadow-md">
      <div className="container-custom flex items-center justify-between py-4">
        {/* Logo or App Name */}
        <Link
          href="/"
          className="text-2xl font-heading hover:text-secondary-light transition-colors duration-200"
        >
          roomies
        </Link>

        {user ? (
          // Navigation Icons for logged-in users
          <nav className="flex items-center space-x-6">
            <NavigationLink
              href="/messages"
              icon={<FaComments className="text-xl" />}
              label="Messaging"
              notificationType="MESSAGE"
            />

            <NavigationLink
              href="/chores"
              icon={<FaTasks className="text-xl" />}
              label="Tasks"
              notificationType="CHORE"
            />

            <NavigationLink
              href="/calendar"
              icon={<FaCalendarAlt className="text-xl" />}
              label="Calendar"
              notificationType="EVENT"
            />

            <NavigationLink
              href="/finances"
              icon={<FaMoneyBillWave className="text-xl" />}
              label="Finances"
              notificationType="EXPENSE"
            />

            <NavigationLink
              href="/settings"
              icon={<FaCog className="text-xl" />}
              label="Settings"
            />

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="btn-accent hover:bg-accent-dark transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </nav>
        ) : (
          // If Not Authenticated
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="btn-primary hover:bg-primary-dark transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="btn-secondary hover:bg-secondary-dark transition-colors duration-200"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
