import { useEffect, useCallback, useRef } from 'react';
import type { ViolationType } from '../lib/types/websocket';

interface ViolationCount {
  TAB_SWITCH: number;
  COPY_ATTEMPT: number;
  PASTE_ATTEMPT: number;
  RIGHT_CLICK: number;
  DEV_TOOLS: number;
  FULL_SCREEN_EXIT: number;
}

interface UseViolationDetectionOptions {
  onViolation: (violationType: ViolationType) => void;
  onWarning?: (message: string) => void;
  enabled?: boolean;
  enableBlocking?: boolean;
}

interface UseViolationDetectionReturn {
  violations: ViolationCount;
  getTotalViolations: () => number;
}

/**
 * Hook to detect various types of test violations
 */
export function useViolationDetection(
  options: UseViolationDetectionOptions
): UseViolationDetectionReturn {
  const {
    onViolation,
    onWarning,
    enabled = true,
    enableBlocking = false,
  } = options;

  const violationsRef = useRef<ViolationCount>({
    TAB_SWITCH: 0,
    COPY_ATTEMPT: 0,
    PASTE_ATTEMPT: 0,
    RIGHT_CLICK: 0,
    DEV_TOOLS: 0,
    FULL_SCREEN_EXIT: 0,
  });

  const recordViolation = useCallback((type: ViolationType, message: string) => {
    violationsRef.current[type]++;
    onViolation(type);
    onWarning?.(message);
  }, [onViolation, onWarning]);

  // Tab switch detection
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH', 'Warning: Tab switching is being monitored.');
      }
    };

    const handleBlur = () => {
      // Small delay to avoid false positives
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          recordViolation('TAB_SWITCH', 'Warning: Leaving the test window is being monitored.');
        }
      }, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, recordViolation]);

  // Copy attempt detection
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      recordViolation('COPY_ATTEMPT', 'Warning: Copying text is not allowed during the test.');
      
      if (enableBlocking) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled, enableBlocking, recordViolation]);

  // Paste attempt detection
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste in input fields for answers
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (!isInputField) {
        recordViolation('PASTE_ATTEMPT', 'Warning: Pasting content is being monitored.');
        
        if (enableBlocking) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, enableBlocking, recordViolation]);

  // Right-click detection
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      recordViolation('RIGHT_CLICK', 'Warning: Right-click is disabled during the test.');
      
      if (enableBlocking) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, enableBlocking, recordViolation]);

  // Developer tools detection
  useEffect(() => {
    if (!enabled) return;

    let devtoolsOpen = false;
    const threshold = 160; // Threshold for detecting devtools

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const orientation = widthThreshold ? 'vertical' : 'horizontal';

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          recordViolation('DEV_TOOLS', 'Warning: Developer tools detected.');
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Check periodically
    const interval = setInterval(detectDevTools, 1000);

    // Also check on resize
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [enabled, recordViolation]);

  // Full-screen exit detection
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('FULL_SCREEN_EXIT', 'Warning: Exiting full-screen mode is discouraged.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [enabled, recordViolation]);

  // Keyboard shortcuts detection (e.g., Ctrl+C, Ctrl+V, F12)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (DevTools)
      if (e.key === 'F12') {
        recordViolation('DEV_TOOLS', 'Warning: Function keys are disabled during the test.');
        if (enableBlocking) {
          e.preventDefault();
        }
      }

      // Ctrl+Shift+I or Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        recordViolation('DEV_TOOLS', 'Warning: Developer tools shortcuts are disabled.');
        if (enableBlocking) {
          e.preventDefault();
        }
      }

      // Ctrl+Shift+J or Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        recordViolation('DEV_TOOLS', 'Warning: Console shortcuts are disabled.');
        if (enableBlocking) {
          e.preventDefault();
        }
      }

      // Ctrl+Shift+C or Cmd+Option+C (Inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        recordViolation('DEV_TOOLS', 'Warning: Inspect element is disabled.');
        if (enableBlocking) {
          e.preventDefault();
        }
      }

      // Ctrl+U or Cmd+U (View source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        recordViolation('DEV_TOOLS', 'Warning: Viewing page source is disabled.');
        if (enableBlocking) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, enableBlocking, recordViolation]);

  const getTotalViolations = useCallback(() => {
    return Object.values(violationsRef.current).reduce((sum, count) => sum + count, 0);
  }, []);

  return {
    violations: violationsRef.current,
    getTotalViolations,
  };
}
