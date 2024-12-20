import { useState, useCallback, useEffect, useMemo } from "react";
import { useUser } from "@/hooks/users/useUser";
import { useThreads } from "@/hooks/threads/useThreads";
import { useQueryClient } from "@tanstack/react-query";
import { threadKeys } from "@/lib/api/services/threadService";
import { logger } from "@/lib/api/logger";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { debounce } from "lodash";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import {
  useHouseholds,
  getHouseholdMembers,
} from "@/hooks/households/useHouseholds";
import { CreateThreadDTO } from "@shared/types";
import { useSocket } from "@/contexts/SocketContext";
import { ChartBarIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface ThreadCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface FormData {
  title: string;
  message: string;
}

interface ValidationState {
  title: boolean;
  message: boolean;
}

export function ThreadCreator({
  isOpen,
  onClose,
  onSuccess,
}: ThreadCreatorProps) {
  const queryClient = useQueryClient();
  const { data: userData } = useUser();
  const activeHouseholdId = userData?.data?.activeHouseholdId;
  const { data: householdsData } = useHouseholds();
  const members = activeHouseholdId
    ? getHouseholdMembers(householdsData, activeHouseholdId)
    : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");

  // Memoize validation state
  const isValid = useMemo(
    () =>
      Boolean(activeHouseholdId && initialMessage.trim() && members?.length),
    [activeHouseholdId, initialMessage, members]
  );

  // Initialize threads hook with proper options
  const { mutateAsync: createThread } = useThreads({
    householdId: activeHouseholdId ?? "",
    enabled: !!activeHouseholdId,
  }).createThread;

  const resetForm = useCallback(() => {
    setTitle("");
    setInitialMessage("");
    setError(null);
    setValidationErrors([]);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Debounced submit handler with error handling
  const debouncedSubmit = useCallback(
    debounce(async (data: { title?: string; message: string }) => {
      if (!isValid || !activeHouseholdId || !members) {
        logger.debug("Cannot submit - validation failed", {
          hasActiveHousehold: !!activeHouseholdId,
          hasMessage: !!data.message.trim(),
          hasMembers: !!members,
        });
        setError("Please fill in all required fields");
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        setValidationErrors([]);

        logger.debug("Creating thread", {
          householdId: activeHouseholdId,
          title: data.title,
          participantCount: members.length,
        });

        const createThreadDTO: CreateThreadDTO = {
          householdId: activeHouseholdId,
          title: data.title?.trim(),
          participants: members.map((member) => member.userId),
          initialMessage: {
            content: data.message.trim(),
          },
        };

        await createThread(createThreadDTO);

        logger.info("Thread created successfully", {
          householdId: activeHouseholdId,
        });

        handleClose();
        onSuccess?.();
      } catch (err) {
        const error = err as ApiError;
        logger.error("Failed to create thread", {
          error,
          householdId: activeHouseholdId,
        });

        if (
          error.type === ApiErrorType.VALIDATION &&
          error.data?.validationErrors
        ) {
          setValidationErrors(
            Object.entries(error.data.validationErrors).map(
              ([field, messages]) => ({
                field,
                message: Array.isArray(messages)
                  ? messages[0]
                  : (messages as string),
              })
            )
          );
        } else if (error.type === ApiErrorType.UNAUTHORIZED) {
          setError(
            "You are not authorized to create threads in this household"
          );
        } else if (error.type === ApiErrorType.NETWORK) {
          setError(
            "Network error. Please check your connection and try again."
          );
        } else {
          setError(error.message || "Failed to create thread");
        }
      } finally {
        setIsSubmitting(false);
      }
    }, 300),
    [isValid, activeHouseholdId, createThread, handleClose, members]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      logger.debug("Skipping submit - already submitting");
      return;
    }

    if (!activeHouseholdId) {
      setError("No active household selected");
      return;
    }

    debouncedSubmit({
      title,
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

  if (!activeHouseholdId) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create New Thread">
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <p className="text-red-600 dark:text-red-400">
            Please select an active household first
          </p>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Thread">
      <form onSubmit={handleSubmit} className="space-y-md">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter thread title"
          required
          disabled={isSubmitting}
          error={validationErrors.find((e) => e.field === "title")?.message}
        />

        <div className="space-y-2xs">
          <label className="form-label">Message</label>
          <div className="relative">
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Enter your message"
              required
              disabled={isSubmitting}
              className={`input min-h-[100px] resize-y pb-12 ${
                validationErrors.find((e) => e.field === "message")
                  ? "border-red-500"
                  : ""
              }`}
            />
          </div>
          {validationErrors.find((e) => e.field === "message") && (
            <p className="form-error">
              {validationErrors.find((e) => e.field === "message")?.message}
            </p>
          )}
        </div>

        {error && (
          <div className="p-md bg-red-50 dark:bg-red-900/10 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-sm">
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
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Thread"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
