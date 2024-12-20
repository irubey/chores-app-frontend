import React from "react";
import { twMerge } from "tailwind-merge";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | number | string[];
  onChange: (value: string | number | string[]) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  multiple?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  helperText,
  className,
  multiple = false,
}: SelectProps) {
  const id = React.useId();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );
      onChange(selectedOptions);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className={twMerge("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        multiple={multiple}
        className={twMerge(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-gray-100",
          "shadow-sm focus:border-primary focus:ring-primary dark:focus:border-primary-light dark:focus:ring-primary-light",
          "sm:text-sm",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          multiple && "min-h-[120px]",
          "transition-colors duration-200"
        )}
      >
        {!multiple && (
          <option value="" disabled>
            Select {label.toLowerCase()}...
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
