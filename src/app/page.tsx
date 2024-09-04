import React from "react"
import Link from 'next/link'



export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome to ChoresApp</h1>
      <Link href="/login" className="mt-4 text-blue-500 hover:underline">
        Login to get started
      </Link>
    </main>
  );
}

