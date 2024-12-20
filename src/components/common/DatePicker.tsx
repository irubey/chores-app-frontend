import React from "react";
import { twMerge } from "tailwind-merge";

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  showTime?: boolean;
  className?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  required = false,
  disabled = false,
  error,
  helperText,
  showTime = false,
  className,
}: DatePickerProps) {
  const id = React.useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ? new Date(e.target.value) : null;
    onChange(newValue);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    if (showTime) {
      return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    }
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  return (
    <div className={twMerge("flex flex-col gap-1", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={showTime ? "datetime-local" : "date"}
        id={id}
        value={formatDate(value)}
        onChange={handleChange}
        min={minDate ? formatDate(minDate) : undefined}
        max={maxDate ? formatDate(maxDate) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={twMerge(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-gray-100",
          "shadow-sm focus:border-primary focus:ring-primary dark:focus:border-primary-light dark:focus:ring-primary-light",
          "sm:text-sm",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          "transition-colors duration-200"
        )}
      />
      {(error || helperText) && (
        <p
          className={twMerge(
            "text-sm",
            error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default DatePicker;
