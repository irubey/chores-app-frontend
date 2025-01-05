import React, { useMemo } from "react";
import { PollWithDetails } from "@shared/types";
import { PollStatus, PollType } from "@shared/enums/poll";
import { usePoll, pollUtils } from "@/hooks/threads/usePoll";
import { useUser } from "@/hooks/users/useUser";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { PollOptions } from "./PollOptions";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

interface PollProps {
  readonly poll: PollWithDetails;
  readonly householdId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly isAuthor: boolean;
}

export const Poll: React.FC<PollProps> = ({
  poll,
  householdId,
  threadId,
  messageId,
  isAuthor,
}) => {
  const { data: userData } = useUser();
  const currentUser = userData?.data;

  const { updatePoll, vote, analytics } = usePoll({
    householdId,
    threadId,
    messageId,
    pollId: poll.id,
  });

  if (
    analytics.isError &&
    analytics.error instanceof ApiError &&
    analytics.error.type === ApiErrorType.NOT_FOUND
  ) {
    return (
      <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md">
        <div className="flex items-center space-x-2 text-text-secondary">
          <XCircleIcon className="h-5 w-5" />
          <span>This poll is no longer available</span>
        </div>
      </div>
    );
  }

  const hasVoted = useMemo(
    () => currentUser && pollUtils.hasVoted(poll, currentUser.id),
    [poll, currentUser]
  );

  const userVote = useMemo(
    () => currentUser && pollUtils.getUserVote(poll, currentUser.id),
    [poll, currentUser]
  );

  const handleVote = (optionId: string, rank?: number) => {
    if (!currentUser || !("mutate" in vote)) return;

    vote.mutate({ optionId, rank });
  };

  const handleStatusChange = (status: PollStatus) => {
    if (!("mutate" in updatePoll)) return;

    updatePoll.mutate({ status });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Poll header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium mb-0">{poll.question}</h4>
        <div className="flex items-center space-x-2">
          {poll.endDate && (
            <div className="text-sm text-text-secondary flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>Ends {format(new Date(poll.endDate), "PPp")}</span>
            </div>
          )}
          {isAuthor && poll.status === PollStatus.OPEN && (
            <button
              onClick={() => handleStatusChange(PollStatus.CLOSED)}
              className="btn btn-secondary btn-sm"
            >
              Close Poll
            </button>
          )}
        </div>
      </div>

      {/* Poll status */}
      {poll.status !== PollStatus.OPEN && (
        <div
          className={cn(
            "text-sm font-medium px-3 py-2 rounded-md",
            poll.status === PollStatus.CLOSED &&
              "bg-neutral-100 dark:bg-neutral-800",
            poll.status === PollStatus.CONFIRMED &&
              "bg-green-100 dark:bg-green-900",
            poll.status === PollStatus.CANCELLED && "bg-red-100 dark:bg-red-900"
          )}
        >
          {poll.status === PollStatus.CLOSED && (
            <div className="flex items-center space-x-2">
              <XCircleIcon className="h-4 w-4" />
              <span>This poll is closed</span>
            </div>
          )}
          {poll.status === PollStatus.CONFIRMED && (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Option confirmed: {poll.selectedOption?.text}</span>
            </div>
          )}
          {poll.status === PollStatus.CANCELLED && (
            <div className="flex items-center space-x-2">
              <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span>This poll was cancelled</span>
            </div>
          )}
        </div>
      )}

      {/* Poll options */}
      <PollOptions
        options={poll.options}
        pollType={poll.pollType}
        totalVotes={pollUtils.getVoteCount(poll)}
        userVote={
          userVote
            ? {
                optionId: userVote.optionId,
                rank: userVote.rank,
              }
            : undefined
        }
        isOpen={poll.status === PollStatus.OPEN && !hasVoted}
        onVote={handleVote}
      />

      {/* Poll info */}
      <div className="text-sm text-text-secondary">
        {pollUtils.getVoteCount(poll)} votes
        {poll.maxChoices && poll.pollType === PollType.MULTIPLE_CHOICE && (
          <span> • Select up to {poll.maxChoices} options</span>
        )}
        {poll.maxRank && poll.pollType === PollType.RANKED_CHOICE && (
          <span> • Rank your top {poll.maxRank} choices</span>
        )}
      </div>
    </div>
  );
};
