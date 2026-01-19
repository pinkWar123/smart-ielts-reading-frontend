import { useCallback, useRef } from 'react';
import type { ViolationType } from '../lib/types/websocket';

export interface ProgressUpdate {
  passageIndex: number;
  questionIndex: number;
  questionNumber?: number;
}

export interface AnswerUpdate {
  questionId: string;
  answer: string | string[];
  questionNumber?: number;
}

export interface HighlightUpdate {
  passageIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

interface UseStudentActivitiesOptions {
  sessionId: string;
  attemptId: string | null;
  onProgressUpdate?: (data: ProgressUpdate) => void;
  onAnswerUpdate?: (data: AnswerUpdate) => void;
  onHighlightUpdate?: (data: HighlightUpdate) => void;
  onViolation?: (violationType: ViolationType) => void;
  progressDebounceMs?: number;
  highlightDebounceMs?: number;
  enabled?: boolean;
}

interface UseStudentActivitiesReturn {
  trackProgress: (passageIndex: number, questionIndex: number, questionNumber?: number) => void;
  trackAnswer: (questionId: string, answer: string | string[], questionNumber?: number) => void;
  trackHighlight: (passageIndex: number, text: string, startOffset: number, endOffset: number) => void;
  trackViolation: (violationType: ViolationType) => void;
}

/**
 * Hook to manage and track student activities with debouncing and throttling
 */
export function useStudentActivities(
  options: UseStudentActivitiesOptions
): UseStudentActivitiesReturn {
  const {
    sessionId,
    attemptId,
    onProgressUpdate,
    onAnswerUpdate,
    onHighlightUpdate,
    onViolation,
    progressDebounceMs = 2000,
    highlightDebounceMs = 2000,
    enabled = true,
  } = options;

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<ProgressUpdate | null>(null);
  const lastProgressTimeRef = useRef<number>(0);
  const lastHighlightTimeRef = useRef<number>(0);

  /**
   * Track student progress with debouncing
   */
  const trackProgress = useCallback(
    (passageIndex: number, questionIndex: number, questionNumber?: number) => {
      if (!enabled || !attemptId) return;

      const progressData: ProgressUpdate = {
        passageIndex,
        questionIndex,
        questionNumber,
      };

      // Store the latest progress
      lastProgressRef.current = progressData;

      // Clear existing timer
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastProgressTimeRef.current;

      // If enough time has passed, send immediately
      if (timeSinceLastUpdate >= progressDebounceMs) {
        lastProgressTimeRef.current = now;
        onProgressUpdate?.(progressData);
      } else {
        // Otherwise, debounce
        progressTimerRef.current = setTimeout(() => {
          lastProgressTimeRef.current = Date.now();
          if (lastProgressRef.current) {
            onProgressUpdate?.(lastProgressRef.current);
          }
        }, progressDebounceMs - timeSinceLastUpdate);
      }
    },
    [enabled, attemptId, progressDebounceMs, onProgressUpdate]
  );

  /**
   * Track student answer (no debouncing - immediate)
   */
  const trackAnswer = useCallback(
    (questionId: string, answer: string | string[], questionNumber?: number) => {
      if (!enabled || !attemptId) return;

      const answerData: AnswerUpdate = {
        questionId,
        answer,
        questionNumber,
      };

      // Answers are sent immediately without debouncing
      onAnswerUpdate?.(answerData);
    },
    [enabled, attemptId, onAnswerUpdate]
  );

  /**
   * Track text highlighting with debouncing
   */
  const trackHighlight = useCallback(
    (passageIndex: number, text: string, startOffset: number, endOffset: number) => {
      if (!enabled || !attemptId) return;

      const highlightData: HighlightUpdate = {
        passageIndex,
        text,
        startOffset,
        endOffset,
      };

      // Clear existing timer
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }

      const now = Date.now();
      const timeSinceLastHighlight = now - lastHighlightTimeRef.current;

      // If enough time has passed, send immediately
      if (timeSinceLastHighlight >= highlightDebounceMs) {
        lastHighlightTimeRef.current = now;
        onHighlightUpdate?.(highlightData);
      } else {
        // Otherwise, debounce
        highlightTimerRef.current = setTimeout(() => {
          lastHighlightTimeRef.current = Date.now();
          onHighlightUpdate?.(highlightData);
        }, highlightDebounceMs - timeSinceLastHighlight);
      }
    },
    [enabled, attemptId, highlightDebounceMs, onHighlightUpdate]
  );

  /**
   * Track violations (immediate - no debouncing)
   */
  const trackViolation = useCallback(
    (violationType: ViolationType) => {
      if (!enabled || !attemptId) return;

      // Violations are sent immediately
      onViolation?.(violationType);
    },
    [enabled, attemptId, onViolation]
  );

  return {
    trackProgress,
    trackAnswer,
    trackHighlight,
    trackViolation,
  };
}
