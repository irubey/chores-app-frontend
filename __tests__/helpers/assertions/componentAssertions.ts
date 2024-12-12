import { screen, within } from "@testing-library/react";
import { testLogger } from "../utils/testLogger";

// Button Assertions
export function assertButton(
  button: HTMLElement,
  config: {
    variant?: "primary" | "secondary" | "accent" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    isDisabled?: boolean;
    hasIcon?: boolean;
    iconPosition?: "left" | "right";
    fullWidth?: boolean;
    text?: string;
  }
) {
  // Base assertions
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass("btn");

  // Variant
  if (config.variant) {
    expect(button).toHaveClass(`btn-${config.variant}`);
  }

  // Size
  if (config.size) {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };
    expect(button).toHaveClass(sizeClasses[config.size]);
  }

  // Loading State
  if (config.isLoading) {
    expect(button).toBeDisabled();
    expect(within(button).getByRole("status")).toBeInTheDocument();
    expect(within(button).getByRole("status")).toHaveClass("animate-spin");
  }

  // Disabled State
  if (config.isDisabled) {
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-60", "cursor-not-allowed");
  }

  // Icon
  if (config.hasIcon) {
    const iconContainer = config.iconPosition === "right" ? "ml-2" : "mr-2";
    const icon = within(button).getByTestId("icon");
    expect(icon).toBeInTheDocument();
    expect(icon.parentElement).toHaveClass(iconContainer);
  }

  // Full Width
  if (config.fullWidth) {
    expect(button).toHaveClass("w-full");
  }

  // Text Content
  if (config.text) {
    expect(button).toHaveTextContent(config.text);
  }

  testLogger.assertLogged("debug", "Button assertion completed");
}

// Input Assertions
export function assertInput(
  input: HTMLElement,
  config: {
    label?: string;
    error?: string;
    helperText?: string;
    hasStartIcon?: boolean;
    hasEndIcon?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    isFullWidth?: boolean;
    variant?: "outlined" | "filled";
    value?: string;
    placeholder?: string;
  }
) {
  // Base assertions
  expect(input).toBeInTheDocument();
  expect(input).toHaveClass("input");

  // Label
  if (config.label) {
    const label = screen.getByText(config.label);
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-sm", "font-medium");
  }

  // Error state
  if (config.error) {
    expect(input).toHaveClass("border-red-500");
    const errorMessage = screen.getByText(config.error);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("text-red-500");
  }

  // Helper text
  if (config.helperText) {
    const helperText = screen.getByText(config.helperText);
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass("text-xs", "text-neutral-500");
  }

  // Icons
  if (config.hasStartIcon) {
    expect(input).toHaveClass("pl-10");
    expect(
      within(input.parentElement!).getByTestId("start-icon")
    ).toBeInTheDocument();
  }

  if (config.hasEndIcon) {
    expect(input).toHaveClass("pr-10");
    expect(
      within(input.parentElement!).getByTestId("end-icon")
    ).toBeInTheDocument();
  }

  // Disabled state
  if (config.isDisabled) {
    expect(input).toBeDisabled();
    expect(input).toHaveClass("opacity-50", "cursor-not-allowed");
  }

  // Required state
  if (config.isRequired) {
    expect(input).toBeRequired();
    if (config.label) {
      expect(screen.getByText("*")).toHaveClass("text-red-500");
    }
  }

  // Full width
  if (config.isFullWidth) {
    expect(input.parentElement?.parentElement).toHaveClass("w-full");
  }

  // Variant
  if (config.variant) {
    if (config.variant === "filled") {
      expect(input).toHaveClass("bg-neutral-100");
    } else {
      expect(input).toHaveClass("bg-transparent");
    }
  }

  // Value
  if (config.value !== undefined) {
    expect(input).toHaveValue(config.value);
  }

  // Placeholder
  if (config.placeholder) {
    expect(input).toHaveAttribute("placeholder", config.placeholder);
  }

  testLogger.assertLogged("debug", "Input assertion completed");
}

// Modal Assertions
export function assertModal(config: {
  isOpen: boolean;
  title?: string;
  content?: string | RegExp;
  size?: "sm" | "md" | "lg" | "xl";
  hasCloseButton?: boolean;
  hasFooter?: boolean;
  backdrop?: boolean;
}) {
  const modal = screen.queryByRole("dialog");

  if (!config.isOpen) {
    expect(modal).not.toBeInTheDocument();
    return;
  }

  expect(modal).toBeInTheDocument();
  expect(modal).toHaveAttribute("aria-modal", "true");

  // Title
  if (config.title) {
    const title = within(modal).getByText(config.title);
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("text-lg", "font-medium");
  }

  // Content
  if (config.content) {
    expect(modal).toHaveTextContent(config.content);
  }

  // Size
  if (config.size) {
    const sizeClass = `max-w-${config.size}`;
    expect(within(modal).getByRole("dialog")).toHaveClass(sizeClass);
  }

  // Close button
  if (config.hasCloseButton) {
    const closeButton = within(modal).getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  }

  // Footer
  if (config.hasFooter) {
    const footer = within(modal).getByTestId("modal-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("border-t");
  }

  // Backdrop
  if (config.backdrop) {
    const backdrop = document.querySelector(".bg-black.bg-opacity-50");
    expect(backdrop).toBeInTheDocument();
  }

  testLogger.assertLogged("debug", "Modal assertion completed");
}

// Spinner Assertions
export function assertSpinner(
  spinner: HTMLElement,
  config: {
    size?: "small" | "medium" | "large";
    color?: string;
    isVisible?: boolean;
  }
) {
  expect(spinner).toHaveAttribute("role", "status");
  expect(spinner).toHaveClass("animate-spin");

  // Size
  if (config.size) {
    const sizeClasses = {
      small: "w-4 h-4 border-2",
      medium: "w-8 h-8 border-3",
      large: "w-12 h-12 border-4",
    };
    expect(spinner).toHaveClass(sizeClasses[config.size]);
  }

  // Color
  if (config.color) {
    expect(spinner).toHaveClass(`border-t-${config.color}`);
  }

  // Visibility
  if (config.isVisible !== undefined) {
    if (config.isVisible) {
      expect(spinner).toBeVisible();
    } else {
      expect(spinner).not.toBeVisible();
    }
  }

  testLogger.assertLogged("debug", "Spinner assertion completed");
}

// Badge Component Suggestion
/*
interface BadgeProps {
  count: number;
  showZero?: boolean;
  max?: number;
  dot?: boolean;
  offset?: [number, number];
  color?: string;
  children: React.ReactNode;
}
*/

// Badge Assertions (once implemented)
export function assertBadge(
  badge: HTMLElement,
  config: {
    count: number;
    showZero?: boolean;
    max?: number;
    isDot?: boolean;
    color?: string;
    hasContent?: boolean;
  }
) {
  expect(badge).toBeInTheDocument();

  const badgeContent = within(badge).getByTestId("badge-content");

  // Count display
  if (config.isDot) {
    expect(badgeContent).toHaveClass("w-2", "h-2", "rounded-full");
  } else {
    if (config.count === 0 && !config.showZero) {
      expect(badgeContent).not.toBeVisible();
    } else if (config.max && config.count > config.max) {
      expect(badgeContent).toHaveTextContent(`${config.max}+`);
    } else {
      expect(badgeContent).toHaveTextContent(config.count.toString());
    }
  }

  // Color
  if (config.color) {
    expect(badgeContent).toHaveClass(`bg-${config.color}`);
  }

  // Content
  if (config.hasContent) {
    expect(within(badge).getByTestId("badge-children")).toBeInTheDocument();
  }

  testLogger.assertLogged("debug", "Badge assertion completed");
}
