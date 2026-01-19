import { useEffect, useRef } from 'react';

export interface TabDetectionOptions {
  onTabSwitch: () => void;
  onWarning?: (message: string) => void;
  enableBlocking?: boolean; // If true, tries to prevent tab switching (limited effectiveness)
}

/**
 * Custom hook to detect when user switches tabs or loses focus
 * Note: Complete blocking is not possible in modern browsers for security reasons
 */
export const useTabDetection = ({
  onTabSwitch,
  onWarning,
  enableBlocking = false,
}: TabDetectionOptions) => {
  const hasShownWarning = useRef(false);

  useEffect(() => {
    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onTabSwitch();

        if (onWarning && !hasShownWarning.current) {
          onWarning('Warning: Tab switching is being monitored. Please stay on this page.');
          hasShownWarning.current = true;
        }
      }
    };

    // Track window blur (switching to another window/app)
    const handleBlur = () => {
      onTabSwitch();

      if (onWarning && !hasShownWarning.current) {
        onWarning('Warning: Please keep focus on the test window.');
        hasShownWarning.current = true;
      }
    };

    // Track beforeunload (trying to close/refresh page)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active test. Are you sure you want to leave?';
      return e.returnValue;
    };

    // Context menu prevention (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      if (enableBlocking) {
        e.preventDefault();
        if (onWarning) {
          onWarning('Right-click is disabled during the test.');
        }
      }
    };

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (enableBlocking) {
        // Ctrl/Cmd + C (copy), Ctrl/Cmd + V (paste), Ctrl/Cmd + A (select all)
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a'].includes(e.key.toLowerCase())) {
          // Allow copy/paste in input fields
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
          }
          e.preventDefault();
        }

        // F12 (DevTools)
        if (e.key === 'F12') {
          e.preventDefault();
        }

        // Ctrl/Cmd + Shift + I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault();
        }
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (enableBlocking) {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (enableBlocking) {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [onTabSwitch, onWarning, enableBlocking]);
};

