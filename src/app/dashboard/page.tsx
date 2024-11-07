"use client";

import { useHousehold } from "@/hooks";
import { useEffect } from "react";

export default function DashboardPage() {
  const { households, status, error, fetchHouseholds } = useHousehold();

  useEffect(() => {
    if (status.list === "idle") {
      fetchHouseholds();
    }
  }, [status.list, fetchHouseholds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1">Dashboard</h1>
        {status.list === "loading" && (
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md">
          {error}
        </div>
      )}

      {status.list === "succeeded" && households.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-text-secondary">No households found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household) => (
            <div
              key={household.id}
              className="p-6 bg-white dark:bg-background-dark shadow-md hover:shadow-lg transition-shadow rounded-lg"
            >
              <h3 className="text-h3 mb-4">{household.name}</h3>
              <div className="space-y-2">
                <p className="text-sm text-text-secondary">
                  Currency: {household.currency}
                </p>
                <p className="text-sm text-text-secondary">
                  Language: {household.language}
                </p>
                <p className="text-sm text-text-secondary">
                  Timezone: {household.timezone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
