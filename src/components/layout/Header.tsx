'use client'
import React from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { selectAuth, logout } from '../../store/slices/authSlice'; // Ensure selectAuth is imported
import { useTheme } from '../../contexts/ThemeContext';
import { FaTasks, FaMoneyBillWave, FaComments, FaCalendarAlt, FaCog } from 'react-icons/fa';
import { fetchNotifications, selectNotifications } from '../../store/slices/notificationsSlice';

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector(selectAuth); // Use the selector
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useSelector(selectNotifications);

  // Helper function to count unseen notifications per feature
  const countUnseen = (type: string) => {
    return notifications.filter(
      (notification) => notification.type === type && !notification.isRead
    ).length;
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-primary dark:bg-primary-dark text-white shadow-md">
      <div className="container-custom flex items-center justify-between py-4">
        {/* Logo or App Name */}
        <Link href="/" className="text-2xl font-heading">roomies</Link>

        {user ? (
          // Navigation Icons for logged-in users
          <nav className="flex items-center space-x-6">
            <Link href="/messages" className="relative flex flex-col items-center hover:text-secondary-light">
                <FaComments className="text-xl" />
                {countUnseen('MESSAGE') > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {countUnseen('MESSAGE')}
                  </span>
                )}
                <span className="mt-1 text-sm">Messaging</span>
            </Link>

            <Link href="/chores" className="relative flex flex-col items-center hover:text-secondary-light">
                <FaTasks className="text-xl" />
                {countUnseen('CHORE') > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {countUnseen('CHORE')}
                  </span>
                )}
                <span className="mt-1 text-sm">Tasks</span>
            </Link>

            <Link href="/calendar" className="relative flex flex-col items-center hover:text-secondary-light">
                <FaCalendarAlt className="text-xl" />
                {countUnseen('EVENT') > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {countUnseen('EVENT')}
                  </span>
                )}
                <span className="mt-1 text-sm">Calendar</span>
            </Link>

            <Link href="/finances" className="relative flex flex-col items-center hover:text-secondary-light">
                <FaMoneyBillWave className="text-xl" />
                {countUnseen('EXPENSE') > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {countUnseen('EXPENSE')}
                  </span>
                )}
                <span className="mt-1 text-sm">Finances</span>
            </Link>

            {/* Settings Icon */}
            <Link href="/settings" className="flex flex-col items-center hover:text-secondary-light">
                <FaCog className="text-xl" />
                <span className="mt-1 text-sm">Settings</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-4 btn-accent"
            >
              Logout
            </button>
          </nav>
        ) : (
          // If Not Authenticated
          <div className="flex items-center space-x-4">
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/register" className="btn-secondary">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;