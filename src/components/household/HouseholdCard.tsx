"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HouseholdWithMembers, HouseholdMemberWithUser } from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { logger } from "@/lib/api/logger";
import {
  FaMoneyBillWave,
  FaComments,
  FaTasks,
  FaCalendarAlt,
} from "react-icons/fa";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";

interface HouseholdCardProps {
  household: HouseholdWithMembers;
}

export default function HouseholdCard({ household }: HouseholdCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin =
    household.members.find((m) => m.userId === user?.id)?.role ===
    HouseholdRole.ADMIN;

  logger.debug("Rendering household card", {
    householdId: household.id,
    isAdmin,
    membersCount: household.members.length,
  });

  return (
    <Card className="relative transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-h3">{household.name}</h3>
        {isAdmin && (
          <Button
            variant="ghost"
            className="text-primary dark:text-primary-light"
            onClick={() => router.push(`/household/${household.id}`)}
          >
            Manage
          </Button>
        )}
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <FaMoneyBillWave className="text-xl text-primary dark:text-primary-light" />
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                0
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <FaComments className="text-xl text-primary dark:text-primary-light" />
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                0
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <FaTasks className="text-xl text-primary dark:text-primary-light" />
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                0
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <FaCalendarAlt className="text-xl text-primary dark:text-primary-light" />
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-text-primary dark:text-text-secondary mb-2">
            Members
          </h4>
          <ul className="space-y-1">
            {household.members
              .filter(
                (m): m is HouseholdMemberWithUser => m.isAccepted && "user" in m
              )
              .sort((a, b) =>
                a.userId === user?.id ? -1 : b.userId === user?.id ? 1 : 0
              )
              .slice(0, 5)
              .map((member) => (
                <li
                  key={member.id}
                  className="text-sm text-text-secondary flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-secondary-dark dark:bg-secondary-light" />
                  <span>{member.user?.name || "Unknown"}</span>
                  {member.role === "ADMIN" && (
                    <span className="text-xs text-primary dark:text-primary-light">
                      (Admin)
                    </span>
                  )}
                </li>
              ))}
            {household.members.filter((m) => m.isAccepted).length > 5 && (
              <li className="text-sm text-text-secondary italic">
                +{household.members.filter((m) => m.isAccepted).length - 5} more
                members
              </li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}
