"use client";

import { useAuth, useHousehold } from "@/hooks";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { households, currentHousehold, members, fetchHouseholds } =
    useHousehold();

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <h2>Households</h2>
        <ul>
          {households.map((household) => (
            <li key={household.id}>{household.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
