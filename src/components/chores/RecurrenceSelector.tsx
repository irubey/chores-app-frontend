import { useState } from "react";
import { RecurrenceFrequency, DaysOfWeek } from "@shared/enums";
import { CreateRecurrenceRuleDTO } from "@shared/types";

interface RecurrenceSelectorProps {
  value: CreateRecurrenceRuleDTO;
  onChange: (rule: CreateRecurrenceRuleDTO) => void;
}

export function RecurrenceSelector({
  value,
  onChange,
}: RecurrenceSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    onChange({
      ...value,
      frequency,
      // Reset related fields when frequency changes
      byWeekDay:
        frequency === RecurrenceFrequency.WEEKLY ? value.byWeekDay || [] : [],
      byMonthDay:
        frequency === RecurrenceFrequency.MONTHLY ? value.byMonthDay || [] : [],
    });
  };

  const handleDayToggle = (day: DaysOfWeek) => {
    const currentDays = value.byWeekDay || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    onChange({ ...value, byWeekDay: newDays });
  };

  const handleMonthDayToggle = (day: number) => {
    const currentDays = value.byMonthDay || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    onChange({ ...value, byMonthDay: newDays });
  };

  // Convert until date to string for input
  const getUntilDateString = () => {
    if (!value.until) return "";
    return value.until.toISOString().split("T")[0];
  };

  // Convert string date to Date object for onChange
  const handleUntilDateChange = (dateString: string) => {
    onChange({
      ...value,
      until: dateString ? new Date(dateString) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Frequency Selection */}
      <div className="space-y-2">
        <label className="form-label">Repeats</label>
        <select
          value={value.frequency}
          onChange={(e) =>
            handleFrequencyChange(e.target.value as RecurrenceFrequency)
          }
          className="input"
        >
          <option value={RecurrenceFrequency.DAILY}>Daily</option>
          <option value={RecurrenceFrequency.WEEKLY}>Weekly</option>
          <option value={RecurrenceFrequency.BIWEEKLY}>Every Two Weeks</option>
          <option value={RecurrenceFrequency.MONTHLY}>Monthly</option>
          <option value={RecurrenceFrequency.YEARLY}>Yearly</option>
        </select>
      </div>

      {/* Interval Selection */}
      <div className="space-y-2">
        <label className="form-label">Every</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="99"
            value={value.interval}
            onChange={(e) =>
              onChange({ ...value, interval: parseInt(e.target.value) || 1 })
            }
            className="input w-20"
          />
          <span className="text-text-secondary">
            {value.frequency.toLowerCase()}
            {value.interval > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Weekly Day Selection */}
      {value.frequency === RecurrenceFrequency.WEEKLY && (
        <div className="space-y-2">
          <label className="form-label">On these days</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(DaysOfWeek).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`px-3 py-1 rounded-full text-sm ${
                  value.byWeekDay?.includes(day)
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-text-secondary"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Day Selection */}
      {value.frequency === RecurrenceFrequency.MONTHLY && (
        <div className="space-y-2">
          <label className="form-label">On these days of the month</label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleMonthDayToggle(day)}
                className={`p-1 text-sm rounded ${
                  value.byMonthDay?.includes(day)
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-text-secondary"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-primary text-sm hover:underline"
      >
        {showAdvanced ? "Hide advanced options" : "Show advanced options"}
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="form-label">Ends</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!value.count && !value.until}
                  onChange={() =>
                    onChange({ ...value, count: undefined, until: undefined })
                  }
                  className="form-radio"
                />
                <span>Never</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!!value.count}
                  onChange={() =>
                    onChange({ ...value, count: 1, until: undefined })
                  }
                  className="form-radio"
                />
                <span>After</span>
                {value.count !== undefined && (
                  <input
                    type="number"
                    min="1"
                    value={value.count}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        count: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input w-20"
                  />
                )}
                <span>occurrences</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={!!value.until}
                  onChange={() =>
                    onChange({
                      ...value,
                      until: new Date(),
                      count: undefined,
                    })
                  }
                  className="form-radio"
                />
                <span>On date</span>
                {value.until && (
                  <input
                    type="date"
                    value={getUntilDateString()}
                    onChange={(e) => handleUntilDateChange(e.target.value)}
                    className="input"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Text */}
      <div className="text-sm text-text-secondary">
        {generateRecurrenceSummary(value)}
      </div>
    </div>
  );
}

function generateRecurrenceSummary(rule: CreateRecurrenceRuleDTO): string {
  const frequency =
    rule.interval === 1
      ? rule.frequency.toLowerCase()
      : `every ${rule.interval} ${rule.frequency.toLowerCase()}s`;

  let summary = `Repeats ${frequency}`;

  if (rule.byWeekDay && rule.byWeekDay.length > 0) {
    summary += ` on ${rule.byWeekDay
      .map((day) => day.slice(0, 3).toLowerCase())
      .join(", ")}`;
  }

  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    summary += ` on day${
      rule.byMonthDay.length > 1 ? "s" : ""
    } ${rule.byMonthDay.join(", ")} of the month`;
  }

  if (rule.count) {
    summary += `, ${rule.count} time${rule.count > 1 ? "s" : ""}`;
  } else if (rule.until) {
    summary += `, until ${rule.until.toLocaleDateString()}`;
  }

  return summary;
}
