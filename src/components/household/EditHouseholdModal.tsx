import React from "react";
import { HouseholdWithMembers, UpdateHouseholdDTO } from "@shared/types";
import { logger } from "@/lib/api/logger";

interface EditHouseholdModalProps {
  household: HouseholdWithMembers;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: UpdateHouseholdDTO) => Promise<void>;
}

export default function EditHouseholdModal({
  household,
  isOpen,
  onClose,
  onUpdate,
}: EditHouseholdModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: UpdateHouseholdDTO = {
      name: formData.get("name") as string,
      currency: formData.get("currency") as string,
      timezone: formData.get("timezone") as string,
      language: formData.get("language") as string,
    };

    logger.debug("Updating household", { data });

    try {
      await onUpdate(data);
      onClose();
    } catch (error) {
      logger.error("Failed to update household", { error });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale">
        <h2 className="text-h3 mb-4">Edit Household</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={household.name}
              required
              className="input"
              placeholder="Enter household name"
            />
          </div>

          <div>
            <label htmlFor="currency" className="form-label">
              Currency
            </label>
            <input
              type="text"
              id="currency"
              name="currency"
              defaultValue={household.currency}
              required
              className="input"
              placeholder="e.g., USD, EUR"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="form-label">
              Timezone
            </label>
            <input
              type="text"
              id="timezone"
              name="timezone"
              defaultValue={household.timezone}
              required
              className="input"
              placeholder="e.g., America/New_York"
            />
          </div>

          <div>
            <label htmlFor="language" className="form-label">
              Language
            </label>
            <input
              type="text"
              id="language"
              name="language"
              defaultValue={household.language}
              required
              className="input"
              placeholder="e.g., en-US"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
