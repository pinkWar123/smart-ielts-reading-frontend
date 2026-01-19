import { useCallback, useRef, useState, useEffect } from 'react';

export interface HighlightData {
  text: string;
  startOffset: number;
  endOffset: number;
  timestamp: number;
}

interface UseTextHighlightOptions {
  onHighlight?: (data: HighlightData) => void;
  debounceMs?: number;
  maxTextLength?: number;
  enabled?: boolean;
}

interface UseTextHighlightReturn {
  highlights: HighlightData[];
  handleMouseUp: (event: React.MouseEvent) => void;
  clearHighlights: () => void;
}

/**
 * Hook to detect and track text highlighting in a passage
 */
export function useTextHighlight(options: UseTextHighlightOptions = {}): UseTextHighlightReturn {
  const {
    onHighlight,
    debounceMs = 2000,
    maxTextLength = 500,
    enabled = true,
  } = options;

  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHighlightTimeRef = useRef<number>(0);

  /**
   * Handle mouse up event to detect text selection
   */
  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    
    // Ignore if no text is selected or it's too short
    if (!selectedText || selectedText.length < 3) {
      return;
    }

    // Truncate text if it's too long
    const truncatedText = selectedText.length > maxTextLength
      ? selectedText.substring(0, maxTextLength) + '...'
      : selectedText;

    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    const highlightData: HighlightData = {
      text: truncatedText,
      startOffset,
      endOffset,
      timestamp: Date.now(),
    };

    // Add to local highlights
    setHighlights((prev) => [...prev, highlightData]);

    // Debounce the callback to prevent spamming
    const now = Date.now();
    const timeSinceLastHighlight = now - lastHighlightTimeRef.current;

    if (timeSinceLastHighlight >= debounceMs) {
      // Send immediately if enough time has passed
      lastHighlightTimeRef.current = now;
      onHighlight?.(highlightData);
    } else {
      // Debounce the callback
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        lastHighlightTimeRef.current = Date.now();
        onHighlight?.(highlightData);
      }, debounceMs - timeSinceLastHighlight);
    }
  }, [enabled, maxTextLength, debounceMs, onHighlight]);

  /**
   * Clear all highlights
   */
  const clearHighlights = useCallback(() => {
    setHighlights([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    highlights,
    handleMouseUp,
    clearHighlights,
  };
}
