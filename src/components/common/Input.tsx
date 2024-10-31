import React, { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "outlined" | "filled";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      className,
      fullWidth = false,
      variant = "outlined",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const baseInputStyles = "input transition-all duration-200 w-full";
    const variantStyles = {
      outlined: `
        border-neutral-300 bg-transparent
        focus:border-primary focus:ring-primary/20
        dark:border-neutral-700 dark:focus:border-primary-light
      `,
      filled: `
        border-transparent bg-neutral-100 
        focus:bg-neutral-50 focus:ring-primary/20
        dark:bg-neutral-800 dark:focus:bg-neutral-700
      `,
    };

    const inputWrapperStyles = twMerge(
      "relative flex flex-col gap-1",
      fullWidth ? "w-full" : "w-auto",
      className
    );

    const inputStyles = twMerge(
      baseInputStyles,
      variantStyles[variant],
      error && "border-red-500 focus:border-red-500 focus:ring-red-200",
      startIcon && "pl-10",
      endIcon && "pr-10",
      disabled &&
        "opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800"
    );

    const labelStyles = twMerge(
      "text-sm font-medium text-neutral-700 dark:text-neutral-300",
      disabled && "opacity-50",
      error && "text-red-500"
    );

    return (
      <div className={inputWrapperStyles}>
        {label && (
          <label className={labelStyles}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            required={required}
            className={inputStyles}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {endIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={twMerge(
              "text-xs mt-1",
              error ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
