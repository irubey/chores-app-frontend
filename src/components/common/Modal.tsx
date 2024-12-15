import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full";
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  maxHeight?: "default" | "screen";
  padding?: "default" | "none";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOutsideClick = true,
  showCloseButton = true,
  maxHeight = "default",
  padding = "default",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset";
      // Restore focus
      previousActiveElement.current?.focus();
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnOutsideClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-[95vw] w-full",
  };

  const heightClasses = {
    default: "max-h-[90vh]",
    screen: "max-h-[95vh]",
  };

  const paddingClasses = {
    default: "px-6 py-4",
    none: "p-0",
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-modal-backdrop overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* Modal Panel */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          ref={modalRef}
          className={cn(
            "relative w-full transform overflow-hidden rounded-lg bg-white dark:bg-background-dark shadow-xl transition-all animate-scale",
            sizeClasses[size],
            heightClasses[maxHeight],
            "flex flex-col"
          )}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex-none border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
              {title && (
                <div
                  className="text-lg font-medium text-text-primary dark:text-text-secondary"
                  id="modal-title"
                >
                  {typeof title === "string" ? <h3>{title}</h3> : title}
                </div>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-md text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn("flex-1 overflow-auto", paddingClasses[padding])}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex-none border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal at the document body level
  return createPortal(modalContent, document.body);
};

export default Modal;
