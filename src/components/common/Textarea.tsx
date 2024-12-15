import React, { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  autoGrow?: boolean;
  minHeight?: number;
  maxHeight?: number;
  variant?: "outlined" | "filled";
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      value,
      onChange,
      error,
      helperText,
      className,
      autoGrow = false,
      minHeight = 60,
      maxHeight = 200,
      variant = "outlined",
      fullWidth = false,
      disabled,
      required,
      style,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow effect
    useEffect(() => {
      if (autoGrow && textareaRef.current) {
        textareaRef.current.style.height = `${minHeight}px`;
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          maxHeight
        )}px`;
      }
    }, [value, autoGrow, minHeight, maxHeight]);

    const baseTextareaStyles =
      "input transition-all duration-200 w-full text-neutral-900 dark:text-neutral-100";

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

    const wrapperStyles = twMerge(
      "relative flex flex-col gap-1 h-full",
      fullWidth ? "w-full" : "w-auto",
      className
    );

    const textareaStyles = twMerge(
      baseTextareaStyles,
      variantStyles[variant],
      error && "border-red-500 focus:border-red-500 focus:ring-red-200",
      disabled &&
        "opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800",
      autoGrow ? "resize-none" : "resize-none h-full",
      "py-3" // Consistent padding for overlaid elements
    );

    const labelStyles = twMerge(
      "text-sm font-medium text-neutral-700 dark:text-neutral-300",
      disabled && "opacity-50",
      error && "text-red-500"
    );

    return (
      <div className={wrapperStyles}>
        {label && (
          <label className={labelStyles}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex-1 min-h-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className={textareaStyles}
            style={{
              ...style,
              ...(autoGrow ? { minHeight, maxHeight } : {}),
            }}
            {...props}
          />

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

          {helperText && !error && value.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-text-secondary dark:text-text-secondary bg-white/80 dark:bg-background-dark/80 px-1 rounded">
              {helperText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
