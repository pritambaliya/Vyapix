import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

const FullscreenContext = createContext(null);

export const FullscreenProvider = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightRestore, setHighlightRestore] = useState(false);

  const highlightTimerRef = useRef(null);
  const sentinelPushedRef = useRef(false);

  const triggerHighlight = useCallback(() => {
    setHighlightRestore(true);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightRestore(false);
    }, 1800);
  }, []);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setHighlightRestore(false);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      if (prev) {
        setHighlightRestore(false);
      }
      return !prev;
    });
  }, []);

  // Push a history sentinel while fullscreen is active to block accidental Browser Back,
  // and clean up cleanly via replaceState on exit without triggering navigation.
  useEffect(() => {
    if (isFullscreen) {
      if (!sentinelPushedRef.current) {
        window.history.pushState(
          { ...(window.history.state || {}), vyapixFullscreenLock: true },
          '',
          window.location.href
        );
        sentinelPushedRef.current = true;
      }
    } else if (sentinelPushedRef.current) {
      sentinelPushedRef.current = false;
      if (window.history.state?.vyapixFullscreenLock) {
        const cleanState = { ...(window.history.state || {}) };
        delete cleanState.vyapixFullscreenLock;
        window.history.replaceState(cleanState, '', window.location.href);
      }
    }
  }, [isFullscreen]);

  // Intercept Browser Back (popstate) and in-app link clicks while in Fullscreen Mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handlePopState = () => {
      window.history.pushState(
        { ...(window.history.state || {}), vyapixFullscreenLock: true },
        '',
        window.location.href
      );
      sentinelPushedRef.current = true;
      triggerHighlight();
    };

    const handleDocumentClick = (event) => {
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      if (
        anchor.hasAttribute('download') ||
        anchor.getAttribute('target') === '_blank'
      ) {
        return;
      }

      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('#') || href.startsWith('blob:') || href.startsWith('data:')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      triggerHighlight();
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;

      // Let open modals/dialogs close on Escape before exiting fullscreen
      const openDialog = document.querySelector(
        '[role="dialog"], [aria-modal="true"]'
      );
      if (openDialog) return;

      exitFullscreen();
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen, triggerHighlight]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen,
        highlightRestore,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        triggerHighlight,
      }}
    >
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  const ctx = useContext(FullscreenContext);
  if (!ctx) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return ctx;
};

export default FullscreenContext;
