"use client";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { logger } from "../lib/api/logger";
import {
  fetchThreads,
  createThread,
  fetchThreadDetails,
  updateThread,
  deleteThread,
  inviteUsersToThread,
  resetThreads,
  selectThread,
  selectThreads,
  selectSelectedThread,
  selectThreadStatus,
  selectThreadError,
} from "../store/slices/threadSlice";

import type {
  ThreadWithMessages,
  ThreadWithParticipants,
  CreateThreadDTO,
  UpdateThreadDTO,
} from "@shared/types";

import { PaginationOptions } from "@shared/interfaces";
import type { RootState } from "../store/store";

export const useThreads = () => {
  const dispatch = useDispatch<AppDispatch>();

  logger.info("useThreads hook initialized");

  // Thread selectors
  const threads = useSelector(selectThreads);
  const selectedThread = useSelector(selectSelectedThread);
  const threadStatus = useSelector(selectThreadStatus);
  const threadError = useSelector(selectThreadError);
  const hasMore = useSelector((state: RootState) => state.threads.hasMore);
  const nextCursor = useSelector(
    (state: RootState) => state.threads.nextCursor
  );

  // Thread actions
  const getThreads = useCallback(
    async (householdId: string, options?: PaginationOptions) => {
      logger.info("Fetching threads", { householdId, options });
      try {
        const result = await dispatch(
          fetchThreads({ householdId, options })
        ).unwrap();
        logger.info("Threads fetched successfully", {
          threadCount: result.length,
          hasMore: hasMore,
          nextCursor: nextCursor,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch threads", { error });
        throw error;
      }
    },
    [dispatch, hasMore, nextCursor]
  );

  const startNewThread = useCallback(
    async (householdId: string, threadData: CreateThreadDTO) => {
      logger.info("Creating new thread", { householdId });
      try {
        const thread = await dispatch(
          createThread({ householdId, threadData })
        ).unwrap();
        logger.info("Thread created successfully", { threadId: thread.id });
        return thread;
      } catch (error) {
        logger.error("Failed to create thread", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const getThreadDetails = useCallback(
    async (householdId: string, threadId: string) => {
      logger.info("Fetching thread details", { threadId });
      try {
        const thread = await dispatch(
          fetchThreadDetails({ householdId, threadId })
        ).unwrap();
        logger.info("Thread details fetched successfully", { threadId });
        return thread;
      } catch (error) {
        logger.error("Failed to fetch thread details", { threadId, error });
        throw error;
      }
    },
    [dispatch]
  );

  const editThread = useCallback(
    async (
      householdId: string,
      threadId: string,
      threadData: UpdateThreadDTO
    ) => {
      logger.info("Updating thread", { threadId });
      try {
        const thread = await dispatch(
          updateThread({ householdId, threadId, threadData })
        ).unwrap();
        logger.info("Thread updated successfully", { threadId });
        return thread;
      } catch (error) {
        logger.error("Failed to update thread", { threadId, error });
        throw error;
      }
    },
    [dispatch]
  );

  const removeThread = useCallback(
    async (householdId: string, threadId: string) => {
      logger.info("Deleting thread", { threadId });
      try {
        await dispatch(deleteThread({ householdId, threadId })).unwrap();
        logger.info("Thread deleted successfully", { threadId });
      } catch (error) {
        logger.error("Failed to delete thread", { threadId, error });
        throw error;
      }
    },
    [dispatch]
  );

  const inviteUsers = useCallback(
    async (householdId: string, threadId: string, userIds: string[]) => {
      logger.info("Inviting users to thread", {
        threadId,
        userCount: userIds.length,
      });
      try {
        const thread = await dispatch(
          inviteUsersToThread({ householdId, threadId, userIds })
        ).unwrap();
        logger.info("Users invited successfully", { threadId });
        return thread;
      } catch (error) {
        logger.error("Failed to invite users", { threadId, error });
        throw error;
      }
    },
    [dispatch]
  );

  return {
    // State
    threads,
    selectedThread,
    threadStatus,
    threadError,
    hasMore,
    nextCursor,

    // Thread actions
    getThreads,
    startNewThread,
    getThreadDetails,
    editThread,
    removeThread,
    inviteUsers,
    selectThread: useCallback(
      (thread: ThreadWithMessages | null) => {
        logger.info("Selecting thread", { threadId: thread?.id });
        dispatch(selectThread(thread));
      },
      [dispatch]
    ),

    // Reset action
    reset: useCallback(() => {
      logger.info("Resetting threads state");
      dispatch(resetThreads());
    }, [dispatch]),
  };
};
