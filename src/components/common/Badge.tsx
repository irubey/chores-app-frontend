import React from "react";
import { twMerge } from "tailwind-merge";
import { IconType } from "react-icons";

interface BadgeProps {
  count?: number;
  showZero?: boolean;
  max?: number;
  dot?: boolean;
  offset?: [number, number];
  color?: "primary" | "secondary" | "accent" | "error" | "warning" | "success";
  size?: "sm" | "md" | "lg";
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "warning"
    | "error"
    | "success";
  icon?: IconType;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  showZero = false,
  max = 99,
  dot = false,
  offset = [0, 0],
  color = "primary",
  size = "md",
  variant,
  icon: Icon,
  children,
  className,
  onClick,
}) => {
  const shouldShowCount = count !== undefined && (count > 0 || showZero || dot);
  const displayValue = dot
    ? ""
    : count && count > max
    ? `${max}+`
    : count?.toString();

  // Base styles following style guide
  const baseStyles = [
    "inline-flex",
    "items-center",
    "justify-center",
    "font-medium",
    "shadow-sm",
    "rounded-full",
    // Hover state
    "hover:opacity-90",
    // Focus state
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    // Transition
    "transition-all",
    "duration-200",
    "ease-in-out",
  ].join(" ");

  // Size variants using style guide type scale
  const sizeClasses = {
    sm: dot ? "w-2 h-2" : "min-w-[16px] h-4 text-xs px-1.5",
    md: dot ? "w-2.5 h-2.5" : "min-w-[20px] h-5 text-sm px-2",
    lg: dot ? "w-3 h-3" : "min-w-[24px] h-6 text-base px-2.5",
  };

  // Color variants using style guide colors
  const colorClasses = {
    primary: "bg-primary text-white focus:ring-primary/20",
    secondary: "bg-secondary text-white focus:ring-secondary/20",
    accent: "bg-accent text-white focus:ring-accent/20",
    error: "bg-red-500 text-white focus:ring-red-500/20",
    warning: "bg-yellow-500 text-white focus:ring-yellow-500/20",
    success: "bg-green-500 text-white focus:ring-green-500/20",
  };

  // Variant styles for text badges
  const variantClasses = {
    primary: "bg-primary-light text-primary-dark",
    secondary: "bg-secondary-light text-secondary-dark",
    accent: "bg-accent-light text-accent-dark",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
  };

  // Position styles for count badge
  const [x, y] = offset;
  const translateX = x ? `translateX(${x}px)` : "translateX(50%)";
  const translateY = y ? `translateY(${y}px)` : "translateY(-50%)";

  const badgeStyles = twMerge(
    baseStyles,
    sizeClasses[size],
    variant ? variantClasses[variant] : colorClasses[color],
    className
  );

  // If it's being used as a count badge
  if (shouldShowCount) {
    return (
      <div
        className="relative inline-flex"
        data-testid="badge-wrapper"
        role="status"
        aria-label={`${count} notifications`}
      >
        {children}
        <span
          data-testid="badge-content"
          className={badgeStyles}
          style={{
            transform: `${translateX} ${translateY}`,
            position: "absolute",
            right: 0,
            top: 0,
          }}
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          aria-hidden={dot}
        >
          {displayValue}
        </span>
      </div>
    );
  }

  // If it's being used as a label badge
  return (
    <span
      className={twMerge(
        badgeStyles,
        "gap-1.5 py-0.5",
        Icon ? "pl-1.5 pr-2" : "px-2"
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;
