'use client'

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} roomies. All rights reserved.
            </p>
          </div>
          <nav className="flex space-x-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
