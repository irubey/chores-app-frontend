import { useState, useCallback, useEffect } from "react";
import { useHouseholds } from "@/hooks/households/useHouseholds";
import { useAuthUser } from "@/contexts/UserContext";
import { useCreateThread } from "@/hooks/threads/useThread";
import { useQueryClient } from "@tanstack/react-query";
import { threadKeys } from "@/lib/api/services/threadService";
import { logger } from "@/lib/api/logger";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { debounce } from "lodash";

interface ThreadCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ThreadCreator({
  isOpen,
  onClose,
  onSuccess,
}: ThreadCreatorProps) {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const { data: householdsData } = useHouseholds();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>("");

  const hasSelectedHousehold = !!selectedHouseholdId?.trim();

  // Initialize createThread mutation
  const { mutateAsync: createThread } = useCreateThread(selectedHouseholdId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
      onSuccess?.();
    },
  });

  const resetForm = useCallback(() => {
    setTitle("");
    setInitialMessage("");
    setSelectedParticipants([]);
    setSelectedHouseholdId("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Debounced submit handler to prevent duplicate submissions
  const debouncedSubmit = useCallback(
    debounce(
      async (data: {
        title: string;
        participants: string[];
        message: string;
      }) => {
        if (!user || !hasSelectedHousehold || !data.message.trim()) {
          logger.debug("Cannot submit - missing required data", {
            hasUser: !!user,
            hasSelectedHousehold,
            hasInitialMessage: !!data.message.trim(),
          });
          setError("Please select a household and enter a message");
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          logger.debug("Creating thread", {
            householdId: selectedHouseholdId,
            title: data.title,
            participantsCount: data.participants.length,
          });

          await createThread({
            title: data.title.trim() || undefined,
            participants: data.participants,
            initialMessage: {
              content: data.message.trim(),
            },
          });

          logger.info("Thread created successfully", {
            householdId: selectedHouseholdId,
          });

          handleClose();
        } catch (error) {
          logger.error("Failed to create thread", { error });
          setError(
            error instanceof Error ? error.message : "Failed to create thread"
          );
        } finally {
          setIsLoading(false);
        }
      },
      300
    ),
    [user, hasSelectedHousehold, selectedHouseholdId, createThread, handleClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      logger.debug("Skipping submit - already loading");
      return;
    }

    if (!hasSelectedHousehold) {
      setError("Please select a household first");
      return;
    }

    debouncedSubmit({
      title,
      participants: selectedParticipants,
      message: initialMessage,
    });
  };

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Thread">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="form-label">Household</label>
          <select
            value={selectedHouseholdId}
            onChange={(e) => setSelectedHouseholdId(e.target.value)}
            className="input"
            required
          >
            <option value="">Select a household</option>
            {householdsData?.data?.map((household) => (
              <option key={household.id} value={household.id}>
                {household.name}
              </option>
            ))}
          </select>
        </div>
        {!hasSelectedHousehold && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Please select a household before creating a thread
            </p>
          </div>
        )}
        <Input
          label="Title (Optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter thread title"
          disabled={isLoading || !hasSelectedHousehold}
        />
        <div className="space-y-1">
          <label className="form-label">Message</label>
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Enter your message"
            required
            disabled={isLoading || !hasSelectedHousehold}
            className="input min-h-[100px] resize-y"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!hasSelectedHousehold}
          >
            Create Thread
          </Button>
        </div>
      </form>
    </Modal>
  );
}
