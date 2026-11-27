import React from 'react';

import {
  AlertTriangle,
  Trash2,
  Info,
  X,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';

const ConfirmDialog = () => {
  const {
    confirmation,
    confirmAction,
    cancelAction,
  } = useToast();

  if (!confirmation) return null;

  const isDanger = confirmation.type === 'danger';

  const Icon = isDanger ? Trash2 : (
    confirmation.type === 'warning'
      ? AlertTriangle
      : Info
  );

  return (
    <div
      className="
        fixed inset-0 z-[10000]
        flex items-center justify-center
        bg-slate-900/40 backdrop-blur-[2px]
        p-4
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          cancelAction();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="
          w-full max-w-md
          bg-white rounded-2xl
          shadow-2xl
          border border-slate-200
          p-5 sm:p-6
          animate-[toastSlideDown_0.25s_ease-out]
        "
      >
        {/* HEADER */}
        <div className="flex items-start gap-3">

          <div
            className={`
              w-11 h-11 rounded-xl
              flex items-center justify-center shrink-0
              ${
                isDanger
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-orange-50 text-orange-600'
              }
            `}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">

            <h2
              id="confirm-title"
              className="text-base font-semibold text-slate-900"
            >
              {confirmation.title}
            </h2>

            <p
              id="confirm-message"
              className="
                mt-1.5 text-sm
                leading-relaxed text-slate-600
              "
            >
              {confirmation.message}
            </p>

          </div>

          <button
            type="button"
            onClick={cancelAction}
            className="
              p-1.5 rounded-lg
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="Close confirmation"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 mt-7">

          <button
            type="button"
            onClick={cancelAction}
            className="
              px-4 py-2.5 rounded-xl
              text-sm font-medium
              border border-slate-200
              text-slate-700
              hover:bg-slate-50
              transition
            "
          >
            {confirmation.cancelText}
          </button>

          <button
            type="button"
            onClick={confirmAction}
            className={`
              px-4 py-2.5 rounded-xl
              text-sm font-semibold
              text-white transition
              ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-orange-500 hover:bg-orange-600'
              }
            `}
          >
            {confirmation.confirmText}
          </button>

        </div>

      </div>
    </div>
  );
};

export default ConfirmDialog;