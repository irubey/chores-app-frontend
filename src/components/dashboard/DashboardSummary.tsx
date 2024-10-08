import React, { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth, useChores, useFinances, useHousehold } from "../../hooks";

const DashboardSummary: React.FC = () => {
  const { theme } = useTheme();
  const { user, status: authStatus } = useAuth();
  const { currentHousehold } = useHousehold();
  const {
    chores,
    loading: choresLoading,
    getChores,
  } = useChores(currentHousehold?.id || "");
  const {
    totalExpenses,
    isLoading: financesLoading,
    getExpenses,
  } = useFinances();
  const [pendingChores, setPendingChores] = useState(0);

  useEffect(() => {
    if (currentHousehold?.id) {
      getChores();
      getExpenses(currentHousehold.id);
    }
  }, [currentHousehold?.id, getChores, getExpenses]);

  useEffect(() => {
    if (chores) {
      const pending = chores.filter(
        (chore) => chore.status === "PENDING"
      ).length;
      setPendingChores(pending);
    }
  }, [chores]);

  if (
    authStatus === "loading" ||
    choresLoading ||
    financesLoading ||
    !currentHousehold
  ) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className={`p-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-neutral-800 text-white" : "bg-white"
      }`}
    >
      <h2 className="text-h2 mb-4">Household Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-h4 font-bold">{pendingChores}</p>
          <p className="text-sm">Pending Chores</p>
        </div>
        <div className="text-center">
          <p className="text-h4 font-bold">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm">Total Expenses</p>
        </div>
        <div className="text-center">
          <p className="text-h4 font-bold">-</p>
          <p className="text-sm">Unread Notifications</p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm">
          Welcome back, {user?.name}! Here's what's happening in your household.
        </p>
      </div>
    </div>
  );
};

export default DashboardSummary;
