import React, { useMemo } from "react";
import { ReactionWithUser } from "@shared/types";
import { ReactionType } from "@shared/enums/messages";
import { cn } from "@/lib/utils";
import { REACTION_EMOJIS } from "./constants";

interface ReactionListProps {
  readonly reactions: ReactionWithUser[];
}

interface GroupedReaction {
  type: ReactionType;
  count: number;
  users: string[];
}

export const ReactionList: React.FC<ReactionListProps> = ({ reactions }) => {
  const groupedReactions = useMemo(() => {
    const groups = reactions.reduce<Record<ReactionType, GroupedReaction>>(
      (acc, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = {
            type: reaction.type,
            count: 0,
            users: [],
          };
        }
        acc[reaction.type].count++;
        acc[reaction.type].users.push(reaction.user.name);
        return acc;
      },
      {} as Record<ReactionType, GroupedReaction>
    );

    return Object.values(groups);
  }, [reactions]);

  return (
    <div className="flex flex-wrap gap-1">
      {groupedReactions.map(({ type, count, users }) => (
        <div
          key={type}
          className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full",
            "bg-neutral-100 dark:bg-neutral-800",
            "text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700",
            "transition-colors duration-200"
          )}
          title={`${users.join(", ")}`}
        >
          <span>{REACTION_EMOJIS[type]}</span>
          <span className="text-text-secondary dark:text-text-secondary">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
};
