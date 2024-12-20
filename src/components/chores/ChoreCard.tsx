import { useState } from "react";
import { ChoreWithAssignees } from "@shared/types";
import { ChoreStatus, SubtaskStatus } from "@shared/enums";
import { format } from "date-fns";
import { FiEdit2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { SubtaskList } from "./SubtaskList";

interface ChoreCardProps {
  chore: ChoreWithAssignees;
  householdId: string;
  onEdit?: (chore: ChoreWithAssignees) => void;
  onComplete?: (choreId: string) => void;
  onSubtaskComplete?: (choreId: string, subtaskId: string) => void;
  onSwapRequest?: (choreId: string) => void;
}

export function ChoreCard({
  chore,
  householdId,
  onEdit,
  onComplete,
  onSubtaskComplete,
  onSwapRequest,
}: ChoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const assignee = chore.assignments[0]?.user;
  const isCompleted = chore.status === ChoreStatus.COMPLETED;
  const completedSubtasks = chore.subtasks.filter(
    (st) => st.status === SubtaskStatus.COMPLETED
  ).length;
  const totalSubtasks = chore.subtasks.length;

  const getAssigneeColor = () => {
    // This is a placeholder - you'll want to map user IDs to consistent colors
    const colors = [
      "bg-primary-light",
      "bg-secondary-light",
      "bg-accent-light",
    ];
    return colors[parseInt(assignee?.id || "0", 16) % colors.length];
  };

  return (
    <div
      className={`card transition-all duration-200 ${
        isCompleted ? getAssigneeColor() : "hover:border-primary"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-h4 line-clamp-1">{chore.title}</h3>
            {onEdit && (
              <button
                onClick={() => onEdit(chore)}
                className="btn-icon text-text-secondary"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {chore.dueDate && (
            <p className="text-sm text-text-secondary">
              Due: {format(new Date(chore.dueDate), "MMM d, yyyy")}
            </p>
          )}
          {assignee && (
            <p className="text-sm text-text-secondary mt-1">
              Assigned to: {assignee.name}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!isCompleted && onComplete && (
            <button
              onClick={() => onComplete(chore.id)}
              className="btn-outline-primary text-sm"
            >
              Complete
            </button>
          )}
          {!isCompleted && onSwapRequest && (
            <button
              onClick={() => onSwapRequest(chore.id)}
              className="btn-outline-secondary text-sm"
            >
              Swap
            </button>
          )}
        </div>
      </div>

      {totalSubtasks > 0 && (
        <>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-text-secondary">
                Subtasks: {completedSubtasks}/{totalSubtasks}
              </div>
              <div className="w-24 h-2 bg-neutral-200 rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-icon"
            >
              {isExpanded ? (
                <FiChevronUp className="w-5 h-5" />
              ) : (
                <FiChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {isExpanded && (
            <SubtaskList
              householdId={householdId}
              choreId={chore.id}
              onSubtaskComplete={onSubtaskComplete}
            />
          )}
        </>
      )}
    </div>
  );
}
