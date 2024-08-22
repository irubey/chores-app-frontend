import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">Login</h1>
      {/* Add your OAuth login buttons or form here */}
      <p className="mt-4 text-gray-500">Login with your account</p>
      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Login with Google</button>
      <Link href="/">
        <a className="mt-4 text-blue-500 hover:underline">Go back to Home</a>
      </Link>
    </main>
  );
}
