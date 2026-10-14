import { useEffect } from 'react';

/**
 * Custom hook to register keyboard shortcuts
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, alt = false, shift = false, preventDefault = true } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isKeyMatch = event.key?.toLowerCase() === key.toLowerCase() || event.code?.toLowerCase() === key.toLowerCase();
      const isCtrlMatch = ctrl ? event.ctrlKey || event.metaKey : true;
      const isAltMatch = alt ? event.altKey : true;
      const isShiftMatch = shift ? event.shiftKey : true;

      if (isKeyMatch && isCtrlMatch && isAltMatch && isShiftMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrl, alt, shift, preventDefault]);
}

export default useKeyboardShortcut;
