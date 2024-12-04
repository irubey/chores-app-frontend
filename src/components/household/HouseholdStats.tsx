import React from "react";
import {
  FaMoneyBillWave,
  FaComments,
  FaTasks,
  FaCalendarAlt,
} from "react-icons/fa";
import { logger } from "@/lib/api/logger";

interface StatItem {
  icon: React.ReactNode;
  count: number;
  label: string;
}

interface HouseholdStatsProps {
  stats: {
    expenses: number;
    messages: number;
    tasks: number;
    events: number;
  };
  className?: string;
}

export default function HouseholdStats({
  stats,
  className,
}: HouseholdStatsProps) {
  logger.debug("Rendering household stats", { stats });

  const statItems: StatItem[] = [
    { icon: <FaMoneyBillWave />, count: stats.expenses, label: "Expenses" },
    { icon: <FaComments />, count: stats.messages, label: "Messages" },
    { icon: <FaTasks />, count: stats.tasks, label: "Tasks" },
    { icon: <FaCalendarAlt />, count: stats.events, label: "Events" },
  ];

  return (
    <div className={`flex justify-between ${className}`}>
      <div className="flex gap-6">
        {statItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative">
              <span className="text-xl text-primary dark:text-primary-light">
                {item.icon}
              </span>
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
