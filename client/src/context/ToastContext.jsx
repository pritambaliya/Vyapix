import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  const timersRef = useRef({});
  const confirmationResolverRef = useRef(null);

  // --------------------------------------------------
  // REMOVE TOAST
  // --------------------------------------------------

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  // --------------------------------------------------
  // ADD TOAST
  // --------------------------------------------------

  const addToast = useCallback(
    ({
      message,
      type = 'info',
      duration = 3500,
      title,
    }) => {
      const id =
        Date.now().toString() +
        Math.random().toString(36).slice(2, 7);

      const newToast = {
        id,
        message,
        type,
        title,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  // --------------------------------------------------
  // NOTIFICATION METHODS
  // --------------------------------------------------

  const success = useCallback(
    (message, title = 'Success') => {
      return addToast({
        message,
        type: 'success',
        title,
        duration: 3500,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error') => {
      return addToast({
        message,
        type: 'error',
        title,
        duration: 5000,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Warning') => {
      return addToast({
        message,
        type: 'warning',
        title,
        duration: 4000,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Information') => {
      return addToast({
        message,
        type: 'info',
        title,
        duration: 3500,
      });
    },
    [addToast]
  );

  // --------------------------------------------------
  // CONFIRMATION DIALOG
  // --------------------------------------------------

  const confirm = useCallback((options = {}) => {
    // Resolve any previous pending confirmation as cancelled.
    if (confirmationResolverRef.current) {
      confirmationResolverRef.current(false);
      confirmationResolverRef.current = null;
    }

    return new Promise((resolve) => {
      confirmationResolverRef.current = resolve;

      setConfirmation({
        title: options.title || 'Are you sure?',
        message:
          options.message ||
          'Please confirm that you want to continue.',

        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',

        type: options.type || 'default',
      });
    });
  }, []);

  // --------------------------------------------------
  // CLOSE CONFIRMATION
  // --------------------------------------------------

  const closeConfirmation = useCallback((result) => {
    const resolver = confirmationResolverRef.current;

    confirmationResolverRef.current = null;
    setConfirmation(null);

    if (resolver) {
      resolver(result);
    }
  }, []);

  const confirmAction = useCallback(() => {
    closeConfirmation(true);
  }, [closeConfirmation]);

  const cancelAction = useCallback(() => {
    closeConfirmation(false);
  }, [closeConfirmation]);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);

      timersRef.current = {};

      if (confirmationResolverRef.current) {
        confirmationResolverRef.current(false);
        confirmationResolverRef.current = null;
      }
    };
  }, []);

  // --------------------------------------------------
  // PROVIDER
  // --------------------------------------------------

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,

        success,
        error,
        warning,
        info,

        confirm,

        confirmation,
        confirmAction,
        cancelAction,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// --------------------------------------------------
// CUSTOM HOOK
// --------------------------------------------------

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider'
    );
  }

  return context;
};

export default ToastContext;