import React from "react";
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to ChoresApp</h1>
          <p className="text-xl text-gray-600 mb-8">
            Simplify your household chore management and collaboration
          </p>
          <Link 
            href="/login" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}

