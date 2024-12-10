import React from "react";
import Modal from "../common/Modal";
import Spinner from "../common/Spinner";

interface LeaveHouseholdModalProps {
  householdName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLeaving: boolean;
  isLastAdmin: boolean;
  isLastMember: boolean;
}

export default function LeaveHouseholdModal({
  householdName,
  isOpen,
  onClose,
  onConfirm,
  isLeaving,
  isLastAdmin,
  isLastMember,
}: LeaveHouseholdModalProps) {
  const getModalContent = () => {
    if (isLastAdmin) {
      return {
        title: "Cannot Leave Household",
        message:
          "You are the last admin of this household. Please assign another admin before leaving or delete the household.",
        showConfirm: false,
      };
    }

    if (isLastMember) {
      return {
        title: "Delete Household?",
        message:
          "You are the last member of this household. The household will be deleted if you leave. Are you sure you want to continue?",
        confirmText: "Delete Household",
        showConfirm: true,
      };
    }

    return {
      title: "Leave Household?",
      message: `Are you sure you want to leave "${householdName}"? This action cannot be undone.`,
      confirmText: "Leave Household",
      showConfirm: true,
    };
  };

  const {
    title,
    message,
    confirmText = "Confirm",
    showConfirm,
  } = getModalContent();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-h3 mb-4">{title}</h2>
        <p className="text-text-secondary mb-6">{message}</p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLeaving}
          >
            Cancel
          </button>
          {showConfirm && (
            <button
              onClick={onConfirm}
              className="btn-accent"
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  {confirmText}
                </>
              ) : (
                confirmText
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
