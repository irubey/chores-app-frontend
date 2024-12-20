import { useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import { Select, SelectOption } from "@/components/common/Select";
import Button from "@/components/common/Button";
import { useChores } from "@/hooks/chores/useChores";
import { useRecurrenceRules } from "@/hooks/chores/useRecurrenceRules";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { HouseholdMember, User, CreateRecurrenceRuleDTO } from "@shared/types";
import { RecurrenceFrequency } from "@shared/enums";
import { logger } from "@/lib/api/logger";

interface CreateChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  members: (HouseholdMember & { user: User })[];
}

interface ChoreForm {
  title: string;
  description: string;
  dueDate: string;
  assigneeIds: string[];
  priority: number;
  recurrenceRule?: CreateRecurrenceRuleDTO;
}

const defaultRecurrenceRule: CreateRecurrenceRuleDTO = {
  frequency: RecurrenceFrequency.WEEKLY,
  interval: 1,
  byWeekDay: [],
  byMonthDay: [],
};

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

const defaultForm: ChoreForm = {
  title: "",
  description: "",
  dueDate: "",
  assigneeIds: [],
  priority: 2, // Default to medium priority
  recurrenceRule: undefined,
};

export function CreateChoreModal({
  isOpen,
  onClose,
  householdId,
  members,
}: CreateChoreModalProps) {
  const { createChore, isCreating } = useChores(householdId);
  const { createRule, isCreating: isCreatingRule } = useRecurrenceRules();
  const [form, setForm] = useState<ChoreForm>(defaultForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let recurrenceRuleId: string | undefined;

      if (form.recurrenceRule) {
        const rule = await createRule(form.recurrenceRule);
        recurrenceRuleId = rule.id;
      }

      await createChore({
        householdId,
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        assignments: form.assigneeIds.map((userId) => ({ userId })),
        priority: form.priority,
        recurrenceRuleId,
      });

      onClose();
      setForm(defaultForm);
    } catch (error) {
      logger.error("Failed to create chore", { error });
    }
  };

  const handleRecurrenceChange = (recurrenceRule: CreateRecurrenceRuleDTO) => {
    setForm((prev) => ({ ...prev, recurrenceRule }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Chore">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          type="textarea"
        />

        <Input
          type="datetime-local"
          label="Due Date"
          value={form.dueDate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, dueDate: e.target.value }))
          }
        />

        <Select
          label="Priority"
          value={form.priority}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, priority: Number(value) }))
          }
          options={PRIORITY_OPTIONS}
        />

        <Select
          label="Assignees"
          value={form.assigneeIds}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              assigneeIds: Array.isArray(value)
                ? value.map(String)
                : [String(value)],
            }))
          }
          options={members.map((member) => ({
            value: member.userId,
            label: member.user.name || member.user.email,
          }))}
          multiple
        />

        <RecurrenceSelector
          value={form.recurrenceRule || defaultRecurrenceRule}
          onChange={handleRecurrenceChange}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || isCreatingRule}
            isLoading={isCreating || isCreatingRule}
          >
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
