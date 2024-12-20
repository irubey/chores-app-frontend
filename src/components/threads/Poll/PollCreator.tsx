import React, { useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PollType } from "@shared/enums/poll";
import { CreatePollDTO } from "@shared/types";
import { DatePicker } from "@/components/common/DatePicker";

interface PollCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePollDTO) => void;
}

interface PollOption {
  text: string;
  order: number;
  startTime?: Date;
  endTime?: Date;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

const POLL_TYPE_OPTIONS = [
  { value: PollType.SINGLE_CHOICE, label: "Single Choice" },
  { value: PollType.MULTIPLE_CHOICE, label: "Multiple Choice" },
  { value: PollType.RANKED_CHOICE, label: "Ranked Choice" },
  { value: PollType.EVENT_DATE, label: "Event Date" },
];

const PollCreator: React.FC<PollCreatorProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<PollType>(PollType.SINGLE_CHOICE);
  const [maxChoices, setMaxChoices] = useState(1);
  const [maxRank, setMaxRank] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [options, setOptions] = useState<PollOption[]>([
    { text: "", order: 0 },
    { text: "", order: 1 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions([...options, { text: "", order: options.length }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions(
      options.map((option, i) =>
        i === index ? { ...option, text: value } : option
      )
    );
  };

  const handleOptionDateChange = (
    index: number,
    field: "startTime" | "endTime",
    date: Date | null
  ) => {
    setOptions(
      options.map((option, i) =>
        i === index ? { ...option, [field]: date } : option
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < MIN_OPTIONS) {
      setError(`At least ${MIN_OPTIONS} options are required`);
      return;
    }

    if (
      pollType === PollType.MULTIPLE_CHOICE &&
      maxChoices > validOptions.length
    ) {
      setError("Max choices cannot exceed number of options");
      return;
    }

    const pollData: CreatePollDTO = {
      question: question.trim(),
      pollType,
      options: validOptions.map((opt, index) => ({
        text: opt.text.trim(),
        order: index,
        startTime: opt.startTime,
        endTime: opt.endTime,
      })),
      maxChoices: pollType === PollType.MULTIPLE_CHOICE ? maxChoices : 1,
      maxRank: pollType === PollType.RANKED_CHOICE ? validOptions.length : null,
      endDate,
      eventId: null,
    };

    onSubmit(pollData);
    resetForm();
  };

  const resetForm = () => {
    setQuestion("");
    setPollType(PollType.SINGLE_CHOICE);
    setMaxChoices(1);
    setMaxRank(null);
    setEndDate(null);
    setOptions([
      { text: "", order: 0 },
      { text: "", order: 1 },
    ]);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Poll" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask?"
          required
        />

        <Select
          label="Poll Type"
          value={pollType}
          onChange={(value) => setPollType(value as PollType)}
          options={POLL_TYPE_OPTIONS}
        />

        {pollType === PollType.MULTIPLE_CHOICE && (
          <Input
            type="number"
            label="Maximum Choices"
            value={maxChoices}
            onChange={(e) =>
              setMaxChoices(Math.max(1, parseInt(e.target.value)))
            }
            min={1}
            max={options.length}
          />
        )}

        <DatePicker
          label="End Date (Optional)"
          value={endDate}
          onChange={setEndDate}
          minDate={new Date()}
          placeholder="Select when poll should end"
        />

        <div className="space-y-2">
          <label className="form-label">Options</label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={
                  pollType === PollType.EVENT_DATE
                    ? "Event Option"
                    : `Option ${index + 1}`
                }
                required
              />
              {pollType === PollType.EVENT_DATE && (
                <div className="flex gap-2">
                  <DatePicker
                    value={option.startTime}
                    onChange={(date) =>
                      handleOptionDateChange(index, "startTime", date)
                    }
                    placeholder="Start"
                    showTime
                  />
                  <DatePicker
                    value={option.endTime}
                    onChange={(date) =>
                      handleOptionDateChange(index, "endTime", date)
                    }
                    placeholder="End"
                    showTime
                  />
                </div>
              )}
              {options.length > MIN_OPTIONS && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveOption(index)}
                  className="shrink-0"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddOption}
              className="w-full"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Option
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Poll
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PollCreator;
