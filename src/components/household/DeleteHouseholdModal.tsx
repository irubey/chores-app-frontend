import React from "react";
import { logger } from "@/lib/api/logger";

interface DeleteHouseholdModalProps {
  householdName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteHouseholdModal({
  householdName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteHouseholdModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      logger.info("Household deletion confirmed");
    } catch (error) {
      logger.error("Failed to delete household", { error });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale">
        <h2 className="text-h3 mb-4 text-red-600 dark:text-red-500">
          Delete Household
        </h2>

        <p className="text-text-primary dark:text-text-secondary mb-6">
          Are you sure you want to delete <strong>{householdName}</strong>? This
          action cannot be undone.
        </p>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Household
          </button>
        </div>
      </div>
    </div>
  );
}
