import React from 'react';
import { Lato, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/SocketContext';
import ThemedBody from '@/components/layouts/ThemedBody';
import "../styles/globals.css";

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

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
      <AuthProvider>
        <ThemeProvider>
          <HouseholdProvider>
            <ThemedBody lato={lato.variable} playfair={playfair.variable}>
              {children}
            </ThemedBody>
          </HouseholdProvider>
        </ThemeProvider>
      </AuthProvider>
    </html>
  );
}
