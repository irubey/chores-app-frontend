import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const paddingVariants = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const variantStyles = {
  default:
    "bg-white dark:bg-background-dark border border-neutral-200 dark:border-neutral-700 shadow-md",
  outline: "border border-neutral-200 dark:border-neutral-700",
  ghost: "border-none shadow-none",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = "default", padding = "md", className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg transition-shadow duration-200 hover:shadow-lg",
          variantStyles[variant],
          paddingVariants[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
