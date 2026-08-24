import { Modal } from './Modal.jsx';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-body-md text-on-surface mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded border border-outline text-body-md hover:bg-surface-container-low"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded text-white text-body-md ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-container'}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
