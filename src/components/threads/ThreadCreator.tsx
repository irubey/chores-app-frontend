import { useState, useCallback, useEffect, useMemo } from "react";
import { useHouseholds } from "@/hooks/households/useHouseholds";
import { useUser } from "@/hooks/users/useUser";
import { useCreateThread } from "@/hooks/threads/useThread";
import { useQueryClient } from "@tanstack/react-query";
import { threadKeys } from "@/lib/api/services/threadService";
import { logger } from "@/lib/api/logger";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { debounce } from "lodash";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

interface ThreadCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

export function ThreadCreator({
  isOpen,
  onClose,
  onSuccess,
}: ThreadCreatorProps) {
  const queryClient = useQueryClient();
  const { data: userData } = useUser();
  const {
    data: householdsData,
    isLoading: isLoadingHouseholds,
    error: householdsError,
  } = useHouseholds();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>("");

  // Memoize validation states
  const validation = useMemo(
    () => ({
      hasSelectedHousehold: !!selectedHouseholdId?.trim(),
      hasMessage: !!initialMessage.trim(),
      isValid: !!selectedHouseholdId?.trim() && !!initialMessage.trim(),
    }),
    [selectedHouseholdId, initialMessage]
  );

  // Initialize createThread mutation with proper error typing
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
    setValidationErrors([]);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Debounced submit handler with proper error handling
  const debouncedSubmit = useCallback(
    debounce(
      async (data: {
        title: string;
        participants: string[];
        message: string;
      }) => {
        if (!validation.isValid) {
          logger.debug("Cannot submit - validation failed", {
            hasSelectedHousehold: validation.hasSelectedHousehold,
            hasMessage: validation.hasMessage,
          });
          setError("Please select a household and enter a message");
          return;
        }

        try {
          setIsSubmitting(true);
          setError(null);
          setValidationErrors([]);

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
        } catch (err) {
          const error = err as ApiError;
          logger.error("Failed to create thread", { error });

          if (
            error.type === ApiErrorType.VALIDATION &&
            error.data?.validationErrors
          ) {
            const errors: ValidationError[] = [];
            Object.entries(error.data.validationErrors).forEach(
              ([field, messages]) => {
                errors.push({
                  field,
                  message: Array.isArray(messages)
                    ? messages[0]
                    : (messages as string),
                });
              }
            );
            setValidationErrors(errors);
          } else {
            setError(error.message || "Failed to create thread");
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      300
    ),
    [validation.isValid, selectedHouseholdId, createThread, handleClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      logger.debug("Skipping submit - already submitting");
      return;
    }

    if (!validation.hasSelectedHousehold) {
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

  // Show loading state while households are loading
  if (isLoadingHouseholds) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create New Thread">
        <div className="flex justify-center items-center h-48">
          <div className="animate-pulse text-text-secondary">
            Loading households...
          </div>
        </div>
      </Modal>
    );
  }

  // Show error state if households failed to load
  if (householdsError) {
    const error = householdsError as ApiError;
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create New Thread">
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <p className="text-red-500">
            {error.message || "Failed to load households"}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Modal>
    );
  }

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
          {validationErrors.find((e) => e.field === "householdId") && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.find((e) => e.field === "householdId")?.message}
            </p>
          )}
        </div>
        {!validation.hasSelectedHousehold && (
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
          disabled={isSubmitting || !validation.hasSelectedHousehold}
          error={validationErrors.find((e) => e.field === "title")?.message}
        />
        <div className="space-y-1">
          <label className="form-label">Message</label>
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Enter your message"
            required
            disabled={isSubmitting || !validation.hasSelectedHousehold}
            className={`input min-h-[100px] resize-y ${
              validationErrors.find((e) => e.field === "message")
                ? "border-red-500"
                : ""
            }`}
          />
          {validationErrors.find((e) => e.field === "message") && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.find((e) => e.field === "message")?.message}
            </p>
          )}
        </div>
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!validation.isValid}
          >
            Create Thread
          </Button>
        </div>
      </form>
    </Modal>
  );
}
