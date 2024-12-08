// frontend/src/hooks/threads/useThread.ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { logger } from "@/lib/api/logger";
import { ThreadService } from "@/lib/api/services/threadService";
import { ThreadWithDetails, CreateThreadDTO } from "@shared/types";
import { requestManager } from "@/lib/api/requestManager";
import { ApiResponse } from "@shared/interfaces";

interface UseThreadOptions {
  householdId?: string;
  threadId?: string;
  onThreadCreated?: () => void;
  onError?: (error: Error) => void;
}

interface OperationState {
  isCreating: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useThread({
  householdId,
  threadId,
  onThreadCreated,
  onError,
}: UseThreadOptions) {
  const { user } = useAuth();
  const [operationState, setOperationState] = useState<OperationState>({
    isCreating: false,
    isLoading: false,
    error: null,
  });

  const createThread = useCallback(
    async (threadData: Omit<CreateThreadDTO, "householdId">) => {
      if (!user || !householdId?.trim()) {
        logger.error("Cannot create thread - missing required data", {
          hasUser: !!user,
          householdId,
        });
        throw new Error("Missing required data to create thread");
      }

      // Create a unique request key that includes the data to deduplicate identical requests
      const requestKey = `create-thread-${householdId}-${JSON.stringify(
        threadData
      )}`;

      try {
        setOperationState((prev) => ({ ...prev, isCreating: true }));
        logger.debug("Creating thread", {
          householdId,
          title: threadData.title,
          participantsCount: threadData.participants?.length || 0,
        });

        // Use dedupRequest to prevent duplicate API calls
        const response = await requestManager.dedupRequest<
          ApiResponse<ThreadWithDetails>
        >(
          requestKey,
          () =>
            ThreadService.prototype.threads.createThread(
              householdId,
              threadData
            ),
          { timeout: 10000 }
        );

        logger.info("Thread created successfully", {
          threadId: response.data.id,
          householdId,
        });

        onThreadCreated?.();
        return response.data;
      } catch (error) {
        logger.error("Failed to create thread", { error });
        onError?.(
          error instanceof Error ? error : new Error("Failed to create thread")
        );
        throw error;
      } finally {
        setOperationState((prev) => ({ ...prev, isCreating: false }));
      }
    },
    [user, householdId, onThreadCreated, onError]
  );

  return {
    createThread,
    ...operationState,
  };
}
