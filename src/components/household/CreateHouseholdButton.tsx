"use client";

import React, { useState } from "react";
import { useCreateHousehold } from "@/hooks/useHouseholds";
import { CreateHouseholdDTO } from "@shared/types/household";
import { logger } from "@/lib/api/logger";

export default function CreateHouseholdButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createHousehold, isPending } = useCreateHousehold();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateHouseholdDTO = {
      name: formData.get("name") as string,
      currency: formData.get("currency") as string,
      timezone: formData.get("timezone") as string,
      language: formData.get("language") as string,
    };

    logger.debug("Creating household", { data });

    createHousehold(data, {
      onSuccess: () => {
        setIsOpen(false);
        e.currentTarget.reset();
      },
    });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        Create Household
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Household</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field w-full"
                  placeholder="Enter household name"
                />
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium mb-1"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  className="input-field w-full"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium mb-1"
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  required
                  className="input-field w-full"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium mb-1"
                >
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  required
                  className="input-field w-full"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
