import React from 'react';
import { Inter } from 'next/font/google';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import "../styles/globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ChoresApp',
  description: 'Simplify household chore management and collaboration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <HouseholdProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </HouseholdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
