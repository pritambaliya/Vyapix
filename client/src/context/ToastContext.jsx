import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 3500, title }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newToast = { id, message, type, title, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => {
    return addToast({ message, type: 'success', title });
  }, [addToast]);

  const error = useCallback((message, title = 'Error') => {
    return addToast({ message, type: 'error', title, duration: 5000 });
  }, [addToast]);

  const warning = useCallback((message, title = 'Warning') => {
    return addToast({ message, type: 'warning', title });
  }, [addToast]);

  const info = useCallback((message, title = 'Info') => {
    return addToast({ message, type: 'info', title });
  }, [addToast]);

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
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
