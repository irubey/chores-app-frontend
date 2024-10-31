//Purpose: Generic modal component for displaying dialogs, confirmations, forms, or additional information.

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
