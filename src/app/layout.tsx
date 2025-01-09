import React from "react";
import AppContent from "../components/layout/AppContent";
import RootProviders from "../components/providers/RootProviders";
import "../styles/globals.css";

export const metadata = {
  title: "Hearth",
  description: "Communal living, simplified.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootProviders>
          <AppContent>{children}</AppContent>
        </RootProviders>
      </body>
    </html>
  );
}
