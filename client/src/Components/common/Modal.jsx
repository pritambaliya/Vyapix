import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={`relative my-8 w-full ${maxWidth} overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-2xl transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-300 bg-slate-200/70 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3
                id="modal-title"
                className="text-sm font-semibold text-slate-900 sm:text-base"
              >
                {title}
              </h3>
            )}

            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-transparent p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-300/70 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(85vh-8rem)] space-y-4 overflow-y-auto p-5 text-slate-800">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-300 bg-slate-200/70 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
