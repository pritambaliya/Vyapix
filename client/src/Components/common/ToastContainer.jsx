import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';

const ToastContainer = () => {
  const { toasts = [], removeToast } = useToast();

  if (!toasts.length) return null;

  const toastStyles = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      border: 'border-emerald-200',
      background: 'bg-white',
      title: 'Success',
      progress: 'bg-emerald-500',
    },

    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      border: 'border-rose-200',
      background: 'bg-white',
      title: 'Something went wrong',
      progress: 'bg-rose-500',
    },

    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      border: 'border-amber-200',
      background: 'bg-white',
      title: 'Warning',
      progress: 'bg-amber-500',
    },

    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      border: 'border-blue-200',
      background: 'bg-white',
      title: 'Information',
      progress: 'bg-blue-500',
    },
  };

  return (
    <div
      className="
        fixed
        top-4
        left-1/2
        -translate-x-1/2
        z-[9999]
        w-[calc(100%-2rem)]
        max-w-md
        flex
        flex-col
        gap-3
        pointer-events-none
      "
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const type = toastStyles[toast.type]
          ? toast.type
          : 'info';

        const style = toastStyles[type];
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            role={type === 'error' ? 'alert' : 'status'}
            className={`
              pointer-events-auto
              relative
              overflow-hidden
              flex
              items-start
              gap-3
              p-4
              rounded-2xl
              border
              ${style.border}
              ${style.background}
              shadow-[0_8px_30px_rgba(0,0,0,0.12)]
              animate-[toastSlideDown_0.35s_ease-out]
            `}
          >
            {/* ICON */}
            <div className="
              w-9 h-9
              rounded-xl
              bg-slate-50
              flex
              items-center
              justify-center
              shrink-0
            ">
              <Icon
                className={`w-5 h-5 ${style.iconColor}`}
                strokeWidth={2.2}
              />
            </div>

            {/* MESSAGE */}
            <div className="flex-1 min-w-0 pt-0.5">

              <h4 className="text-sm font-semibold text-slate-900">
                {toast.title || style.title}
              </h4>

              <p className="
                mt-1
                text-sm
                text-slate-600
                leading-relaxed
                break-words
              ">
                {toast.message}
              </p>

            </div>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="
                shrink-0
                p-1.5
                rounded-lg
                text-slate-400
                hover:text-slate-700
                hover:bg-slate-100
                transition-all
              "
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;