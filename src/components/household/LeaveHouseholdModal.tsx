import React from "react";
import Modal from "../common/Modal";

interface LeaveHouseholdModalProps {
  householdName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function LeaveHouseholdModal({
  householdName,
  isOpen,
  onClose,
  onConfirm,
}: LeaveHouseholdModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-h3 mb-4">Leave Household?</h2>
        <p className="text-text-secondary mb-6">
          Are you sure you want to leave "{householdName}"? This action cannot
          be undone.
        </p>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn-accent">
            Leave Household
          </button>
        </div>
      </div>
    </Modal>
  );
}
