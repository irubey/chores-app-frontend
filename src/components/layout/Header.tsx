"use client";
import React from "react";
import Link from "next/link";
import { User } from "@shared/types";
import { useAuth, useAuthActions } from "@/contexts/UserContext";
import { useTheme } from "../../contexts/ThemeContext";
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
  const { logout } = useAuthActions();
  const { theme, toggleTheme } = useTheme();

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
      className="relative flex flex-col items-center text-white hover:text-accent-light transition-colors duration-200"
    >
      {icon}
      <span className="mt-1 text-sm font-medium">{label}</span>
    </Link>
  );

  return (
    <header className="bg-primary dark:bg-primary-dark text-white shadow-lg">
      <div className="container-custom flex items-center justify-between py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-2xl font-heading text-white hover:text-accent-light transition-colors duration-200 font-bold"
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
              className="p-2 rounded-full bg-primary-dark hover:bg-primary-light text-white transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <FaSun className="text-xl" />
              ) : (
                <FaMoon className="text-xl" />
              )}
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark dark:bg-accent-light dark:hover:bg-accent transition-colors duration-200 rounded-md shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-dark hover:bg-accent transition-colors duration-200 rounded-md shadow-sm hover:shadow-md"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark transition-colors duration-200 rounded-md shadow-sm hover:shadow-md"
            >
              Register
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-primary-dark hover:bg-primary-light text-white transition-colors duration-200"
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
