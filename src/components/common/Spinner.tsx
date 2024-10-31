import { FC } from "react";
import { twMerge } from "tailwind-merge";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  className?: string;
}

const Spinner: FC<SpinnerProps> = ({
  size = "medium",
  color = "primary",
  className,
}) => {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
  };

  const colorClasses = {
    primary: "border-primary",
    secondary: "border-secondary",
    accent: "border-accent",
  };

  const baseClasses =
    "inline-block rounded-full border-transparent animate-spin";
  const borderColorClass = `border-t-${
    colorClasses[color as keyof typeof colorClasses]
  }`;

  return (
    <div
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        borderColorClass,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
