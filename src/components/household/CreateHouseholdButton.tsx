"use client";

import React, { useState, useRef, useEffect } from "react";
import { useHousehold } from "@/hooks/useHousehold";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";
import { CreateHouseholdDTO } from "@shared/types";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import { PlusIcon } from "@heroicons/react/24/solid";

export default function CreateHouseholdButton() {
  const { createHousehold } = useHousehold();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
  }>({});
  const [newHouseholdData, setNewHouseholdData] = useState<CreateHouseholdDTO>({
    name: "",
    currency: "USD",
    timezone: "UTC",
    language: "en",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isModalOpen]);

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!newHouseholdData.name) {
      errors.name = "Name is required";
    } else if (newHouseholdData.name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    } else if (newHouseholdData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateHousehold = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsUpdating(true);
      setError(null);

      logger.debug("Creating household", {
        name: newHouseholdData.name,
      });

      await createHousehold(newHouseholdData);
      setIsModalOpen(false);
      setNewHouseholdData({
        name: "",
        currency: "USD",
        timezone: "UTC",
        language: "en",
      });
      setFormErrors({});
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create household");
      }
      logger.error("Failed to create household", { error: err });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
      >
        <PlusIcon className="h-5 w-5" />
        Create Household
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormErrors({});
          setError(null);
        }}
        title="Create New Household"
        footer={
          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setFormErrors({});
                setError(null);
              }}
              disabled={isUpdating}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="create-household-form"
              isLoading={isUpdating}
              disabled={isUpdating || !newHouseholdData.name}
            >
              Create
            </Button>
          </div>
        }
      >
        <form
          id="create-household-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isUpdating && newHouseholdData.name) {
              handleCreateHousehold();
            }
          }}
          className="space-y-4"
        >
          <Input
            ref={inputRef}
            label="Household Name"
            value={newHouseholdData.name}
            onChange={(e) => {
              setNewHouseholdData({
                ...newHouseholdData,
                name: e.target.value,
              });
              if (formErrors.name) {
                setFormErrors({ ...formErrors, name: undefined });
              }
            }}
            placeholder="Enter household name"
            required
            minLength={3}
            maxLength={100}
            error={formErrors.name}
            helperText={
              formErrors.name || "Name must be between 3 and 100 characters"
            }
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Modal>
    </>
  );
}
