import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const icons = {
    danger: (
      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
    ),
    warning: (
      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
    ),
    info: (
      <Info className="h-5 w-5 shrink-0 text-blue-600" />
    ),
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-200/60 p-4">
        {icons[variant] || icons.danger}

        <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
