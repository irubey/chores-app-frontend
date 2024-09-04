// src/components/Navbar.tsx
import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex space-x-4">
        <li>
          <Link href="/">
            Home
          </Link>
        </li>
        <li>
          <Link href="/dashboard">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/login">
            Login
          </Link>
        </li>
      </ul>
    </nav>
  );
}
