import React from "react";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  count: number;
  showZero?: boolean;
  max?: number;
  dot?: boolean;
  offset?: [number, number];
  color?: "primary" | "secondary" | "accent" | "error" | "warning" | "success";
  size?: "sm" | "md" | "lg";
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
  children,
  className,
  onClick,
}) => {
  const shouldShow = count > 0 || showZero || dot;
  const displayValue = dot ? "" : count > max ? `${max}+` : count.toString();

  // Base styles following style guide
  const baseStyles = [
    "absolute",
    "flex",
    "items-center",
    "justify-center",
    "font-medium",
    "shadow-sm",
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
    sm: dot ? "w-2 h-2" : "min-w-[16px] h-4 text-h6 px-1",
    md: dot ? "w-2.5 h-2.5" : "min-w-[20px] h-5 text-h5 px-1.5",
    lg: dot ? "w-3 h-3" : "min-w-[24px] h-6 text-h4 px-2",
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

  // Position styles
  const [x, y] = offset;
  const translateX = x ? `translateX(${x}px)` : "translateX(50%)";
  const translateY = y ? `translateY(${y}px)` : "translateY(-50%)";

  const badgeStyles = twMerge(
    baseStyles,
    sizeClasses[size],
    colorClasses[color],
    "rounded-full",
    "origin-top-right",
    !dot && "animate-scale-in",
    className
  );

  return (
    <div
      className="relative inline-flex"
      data-testid="badge-wrapper"
      role="status"
      aria-label={`${count} notifications`}
    >
      {children}
      {shouldShow && (
        <span
          data-testid="badge-content"
          className={badgeStyles}
          style={{
            transform: `${translateX} ${translateY}`,
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
      )}
      {children && (
        <span data-testid="badge-children" className="inline-block">
          {children}
        </span>
      )}
    </div>
  );
};

export default Badge;
