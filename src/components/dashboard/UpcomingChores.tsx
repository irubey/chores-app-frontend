"use client";

import React, { useEffect } from "react";
import { Chore, ChoreStatus } from "../../types/chore";
import Button from "../common/Button";
import { useTheme } from "../../contexts/ThemeContext";
import { useChores, useAuth, useHousehold } from "../../hooks";

const UpcomingChores: React.FC = () => {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();
  const { chores, loading, error, getChores, editChore } = useChores(
    currentHousehold?.id || ""
  );
  const { theme } = useTheme();

  useEffect(() => {
    if (currentHousehold?.id) {
      getChores();
    }
  }, [currentHousehold?.id, getChores]);

  const upcomingChores = chores
    .filter(
      (chore) =>
        chore.status !== ChoreStatus.COMPLETED &&
        chore.assignedUserIds?.includes(user?.id || "")
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate || "").getTime() -
        new Date(b.dueDate || "").getTime()
    );

  const handleCompleteChore = (choreId: string) => {
    if (currentHousehold?.id) {
      editChore(choreId, { status: ChoreStatus.COMPLETED });
    }
  };

  if (loading.fetchChores) {
    return <div className="text-center">Loading upcoming chores...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div
      className={`p-4 rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
      }`}
    >
      <h2 className="text-h2 mb-4">Upcoming Chores</h2>
      {upcomingChores.length === 0 ? (
        <p>No upcoming chores. Great job!</p>
      ) : (
        <ul className="space-y-4">
          {upcomingChores.map((chore: Chore) => (
            <li key={chore.id} className="flex items-center justify-between">
              <div>
                <h3 className="text-h5">{chore.title}</h3>
                <p className="text-sm text-gray-500">
                  Due:{" "}
                  {chore.dueDate
                    ? new Date(chore.dueDate).toLocaleDateString()
                    : "No due date"}
                </p>
              </div>
              <Button
                onClick={() => handleCompleteChore(chore.id)}
                className="btn-primary"
                disabled={loading.updateChore}
              >
                {loading.updateChore ? "Updating..." : "Complete"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingChores;
