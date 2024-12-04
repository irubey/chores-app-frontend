"use client";
import React from "react";
import Link from "next/link";
import { User } from "@shared/types";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useRouter } from "next/navigation";
import {
  FaTasks,
  FaMoneyBillWave,
  FaComments,
  FaCalendarAlt,
  FaCog,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { logger } from "@/lib/api/logger";

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const { notifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  // Helper function to count unseen notifications per feature
  const countUnseen = (type: string) => {
    return notifications.filter(
      (notification) => notification.type === type && !notification.isRead
    ).length;
  };

  const handleLogout = async () => {
    try {
      logger.debug("Header: Initiating logout");
      await logout();
      logger.info("Header: Logout successful");
      router.push("/login");
    } catch (error) {
      logger.error("Header: Logout failed", { error });
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
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-2xl font-heading text-white hover:text-secondary-light transition-colors duration-200"
        >
          roomies
        </Link>

        {user ? (
          <nav className="flex items-center space-x-6">
            <NavigationLink
              href="/threads"
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

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-primary-dark dark:hover:bg-primary-light transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <FaSun className="text-xl" />
              ) : (
                <FaMoon className="text-xl" />
              )}
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark dark:bg-accent-light dark:hover:bg-accent transition-colors duration-200 rounded-md"
              >
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-dark hover:bg-primary-light transition-colors duration-200 rounded-md"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary-dark transition-colors duration-200 rounded-md"
            >
              Register
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-primary-dark dark:hover:bg-primary-light transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <FaSun className="text-xl" />
              ) : (
                <FaMoon className="text-xl" />
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
