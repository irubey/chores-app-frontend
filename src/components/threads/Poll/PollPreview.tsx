import React from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { CreatePollDTO } from "@shared/types";
import { PollType } from "@shared/enums/poll";

interface PollPreviewProps {
  poll: CreatePollDTO;
  onRemove: () => void;
}

export function PollPreview({ poll, onRemove }: PollPreviewProps) {
  const getPollTypeLabel = (type: PollType) => {
    switch (type) {
      case PollType.SINGLE_CHOICE:
        return "Single Choice";
      case PollType.MULTIPLE_CHOICE:
        return "Multiple Choice";
      case PollType.RANKED_CHOICE:
        return "Ranked Choice";
      case PollType.EVENT_DATE:
        return "Event Date";
      default:
        return "Poll";
    }
  };

  return (
    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-primary dark:text-text-secondary">
              {poll.question}
            </h4>
            <button
              type="button"
              onClick={onRemove}
              className="text-text-secondary hover:text-red-500 transition-colors"
              aria-label="Remove poll"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary mb-2">
            {getPollTypeLabel(poll.pollType)}
            {poll.maxChoices > 1 && ` • Max ${poll.maxChoices} choices`}
            {poll.endDate &&
              ` • Ends ${new Date(poll.endDate).toLocaleDateString()}`}
          </p>
          <ul className="space-y-1">
            {poll.options.map((option, i) => (
              <li
                key={i}
                className="text-sm text-text-secondary dark:text-text-secondary"
              >
                {option.text}
                {poll.pollType === PollType.EVENT_DATE && option.startTime && (
                  <span className="text-xs ml-2">
                    {new Date(option.startTime).toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PollPreview;
