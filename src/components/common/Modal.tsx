import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
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
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white dark:bg-background-dark shadow-xl transition-all animate-scale`}
          tabIndex={-1} // Makes the div focusable
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
              {title && (
                <h3
                  className="text-lg font-medium text-text-primary dark:text-text-secondary"
                  id="modal-title"
                >
                  {title}
                </h3>
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
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
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
