import { useSubtasks } from "@/hooks/chores/useSubtasks";
import { SubtaskStatus } from "@shared/enums";

interface SubtaskListProps {
  householdId: string;
  choreId: string;
  onSubtaskComplete?: (choreId: string, subtaskId: string) => void;
}

export function SubtaskList({
  householdId,
  choreId,
  onSubtaskComplete,
}: SubtaskListProps) {
  const { subtasks, updateSubtask } = useSubtasks(householdId, choreId);

  const handleSubtaskComplete = (subtaskId: string) => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    updateSubtask({
      subtaskId,
      data: {
        title: subtask.title,
        status: SubtaskStatus.COMPLETED,
      },
    });

    onSubtaskComplete?.(choreId, subtaskId);
  };

  return (
    <div className="mt-4 space-y-2">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-800"
        >
          <span className="text-sm">{subtask.title}</span>
          <input
            type="checkbox"
            checked={subtask.status === SubtaskStatus.COMPLETED}
            onChange={() => handleSubtaskComplete(subtask.id)}
            className="form-checkbox h-4 w-4 text-primary"
          />
        </div>
      ))}
    </div>
  );
}
