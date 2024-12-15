import React from "react";
import { PollOptionWithVotes } from "@shared/types";
import { PollType } from "@shared/enums/poll";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface PollOptionsProps {
  readonly options: PollOptionWithVotes[];
  readonly pollType: PollType;
  readonly totalVotes: number;
  readonly userVote?: { optionId: string; rank?: number };
  readonly isOpen: boolean;
  readonly onVote: (optionId: string, rank?: number) => void;
}

export const PollOptions: React.FC<PollOptionsProps> = ({
  options,
  pollType,
  totalVotes,
  userVote,
  isOpen,
  onVote,
}) => {
  const getVotePercentage = (optionVotes: number) => {
    if (totalVotes === 0) return 0;
    return (optionVotes / totalVotes) * 100;
  };

  const renderOption = (option: PollOptionWithVotes) => {
    const percentage = getVotePercentage(option.voteCount);
    const isSelected = userVote?.optionId === option.id;
    const rank = isSelected ? userVote?.rank : undefined;

    return (
      <div
        key={option.id}
        className={cn(
          "relative overflow-hidden rounded-md border",
          "transition-all duration-200",
          isSelected
            ? "border-primary dark:border-primary-light"
            : "border-neutral-200 dark:border-neutral-700",
          isOpen && "hover:border-primary cursor-pointer"
        )}
        onClick={() => isOpen && onVote(option.id, rank)}
      >
        {/* Progress bar background */}
        <div
          className="absolute inset-0 bg-primary-light dark:bg-primary-dark opacity-10"
          style={{ width: `${percentage}%` }}
        />

        {/* Option content */}
        <div className="relative p-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {pollType === PollType.RANKED_CHOICE && rank && (
                <span className="text-sm font-medium text-text-secondary">
                  #{rank}
                </span>
              )}
              <span className="font-medium">{option.text}</span>
              {isSelected && (
                <CheckCircleIcon className="h-4 w-4 text-primary dark:text-primary-light" />
              )}
            </div>
            {option.startTime && (
              <div className="text-sm text-text-secondary">
                {format(new Date(option.startTime), "PPp")}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {pollType === PollType.RANKED_CHOICE && isOpen && (
              <div className="flex flex-col space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(option.id, (rank ?? 0) + 1);
                  }}
                  className="btn-icon p-1"
                  disabled={!isSelected || (rank ?? 0) >= options.length}
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(option.id, Math.max(1, (rank ?? 2) - 1));
                  }}
                  className="btn-icon p-1"
                  disabled={!isSelected || (rank ?? 0) <= 1}
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="text-sm font-medium">
              {option.voteCount} ({Math.round(percentage)}%)
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {options.sort((a, b) => a.order - b.order).map(renderOption)}
    </div>
  );
};
