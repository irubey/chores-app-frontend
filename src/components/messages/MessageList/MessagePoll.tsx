import React from "react";
import { PollWithDetails, User } from "@shared/types";
import { useMessages } from "@/hooks/useMessages";
import { ChartBarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface MessagePollProps {
  poll: PollWithDetails;
  messageId: string;
  threadId: string;
  householdId: string;
  currentUser: User;
}

const MessagePoll: React.FC<MessagePollProps> = ({
  poll,
  messageId,
  threadId,
  householdId,
  currentUser,
}) => {
  const { voteOnPoll, removeVoteFromPoll } = useMessages();

  // Calculate percentages and total votes
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.votes.length,
    0
  );

  const hasUserVoted = poll.options.some((option) =>
    option.votes.some((vote) => vote.userId === currentUser?.id)
  );

  const getUserVote = () => {
    for (const option of poll.options) {
      const vote = option.votes.find((v) => v.userId === currentUser?.id);
      if (vote) return { optionId: option.id, voteId: vote.id };
    }
    return null;
  };

  const userVoteInfo = getUserVote();

  const handleVote = async (optionId: string) => {
    if (hasUserVoted) {
      if (userVoteInfo?.voteId) {
        await removeVoteFromPoll(
          householdId,
          threadId,
          messageId,
          poll.id,
          userVoteInfo.voteId
        );
      }
    } else {
      await voteOnPoll(householdId, threadId, messageId, poll.id, { optionId });
    }
  };

  return (
    <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
      {/* Poll Title */}
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="h-5 w-5 text-primary" />
        <h4 className="text-lg font-medium">{poll.question}</h4>
      </div>

      {/* Poll Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = option.id === userVoteInfo?.optionId;

          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleVote(option.id)}
                disabled={poll.endDate !== null}
                className={`w-full p-3 rounded-md transition-all duration-200 relative z-10
                  ${
                    poll.endDate !== null
                      ? "cursor-default"
                      : "hover:bg-primary-light dark:hover:bg-primary-dark hover:text-primary-dark dark:hover:text-primary-light"
                  }
                  ${
                    isSelected
                      ? "bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light"
                      : "bg-white dark:bg-background-dark"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircleIcon className="h-5 w-5 text-primary" />
                    )}
                    {option.text}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {voteCount} {voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
              </button>

              {/* Progress Bar */}
              <div
                className="absolute inset-0 bg-primary bg-opacity-10 dark:bg-opacity-20 rounded-md transition-all duration-500"
                style={{ width: `${percentage}%` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>

      {/* Poll Info */}
      <div className="mt-4 text-sm text-text-secondary">
        <span>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} •{" "}
          {!poll.endDate ? (
            "Poll is active"
          ) : (
            <span className="text-red-500">Poll is closed</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default MessagePoll;
