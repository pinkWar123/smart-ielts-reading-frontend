import { useCallback, useRef, useEffect, useState } from 'react';
import type { WebSocketMessage } from '../lib/types/websocket';

interface OptimizedWebSocketOptions {
  onMessageBatch?: (messages: WebSocketMessage[]) => void;
  bufferInterval?: number; // ms
  maxBufferSize?: number;
  enablePriorityQueue?: boolean;
  enableDeduplication?: boolean;
}

interface UseOptimizedWebSocketReturn {
  handleMessage: (message: WebSocketMessage) => void;
  messageCount: number;
  clearBuffer: () => void;
}

/**
 * Hook for optimized WebSocket message handling with batching and prioritization
 */
export function useOptimizedWebSocket(
  options: OptimizedWebSocketOptions
): UseOptimizedWebSocketReturn {
  const {
    onMessageBatch,
    bufferInterval = 300,
    maxBufferSize = 50,
    enablePriorityQueue = false,
    enableDeduplication = false,
  } = options;

  const messageBuffer = useRef<WebSocketMessage[]>([]);
  const messageCountRef = useRef<number>(0);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());

  /**
   * Get message priority (lower number = higher priority)
   */
  const getMessagePriority = (message: WebSocketMessage): number => {
    switch (message.type) {
      case 'error':
      case 'session_completed':
        return 0; // Highest priority
      case 'violation':
      case 'student_submitted':
        return 1; // High priority
      case 'student_answer':
      case 'student_progress':
        return 2; // Medium priority
      case 'student_highlight':
      case 'participant_joined':
      case 'participant_disconnected':
        return 3; // Lower priority
      default:
        return 4; // Lowest priority
    }
  };

  /**
   * Generate a unique ID for a message for deduplication
   */
  const getMessageId = (message: WebSocketMessage): string => {
    if (message.type === 'student_progress' && 'student_id' in message) {
      // For progress, only keep the latest per student
      return `progress-${message.student_id}`;
    }
    if (message.type === 'student_answer' && 'student_id' in message && 'question_id' in message) {
      // For answers, keep one per student per question
      return `answer-${message.student_id}-${message.question_id}`;
    }
    // For others, use timestamp + type as unique ID
    return `${message.type}-${message.timestamp}-${Math.random()}`;
  };

  /**
   * Check if message should be deduplicated
   */
  const shouldDeduplicate = (message: WebSocketMessage): boolean => {
    if (!enableDeduplication) return false;

    const messageId = getMessageId(message);
    
    // Only deduplicate certain message types
    if (message.type === 'student_progress') {
      // Check if we've seen this exact student progress recently
      if (seenMessageIds.current.has(messageId)) {
        return true; // Skip duplicate
      }
      seenMessageIds.current.add(messageId);
      // Clear old IDs after some time
      setTimeout(() => seenMessageIds.current.delete(messageId), 5000);
      return false;
    }

    return false;
  };

  /**
   * Flush buffer and send messages
   */
  const flushBuffer = useCallback(() => {
    if (messageBuffer.current.length === 0) return;

    // Sort by priority if enabled
    if (enablePriorityQueue) {
      messageBuffer.current.sort((a, b) => 
        getMessagePriority(a) - getMessagePriority(b)
      );
    }

    // Send batch to handler
    if (onMessageBatch) {
      onMessageBatch([...messageBuffer.current]);
    }

    // Clear buffer
    messageBuffer.current = [];

    // Clear timer
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [onMessageBatch, enablePriorityQueue]);

  /**
   * Handle incoming message
   */
  const handleMessage = useCallback((message: WebSocketMessage) => {
    messageCountRef.current++;

    // Check for deduplication
    if (shouldDeduplicate(message)) {
      return; // Skip duplicate
    }

    // Add to buffer
    messageBuffer.current.push(message);

    // Flush immediately if buffer is full
    if (messageBuffer.current.length >= maxBufferSize) {
      flushBuffer();
      return;
    }

    // Schedule flush if not already scheduled
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flushBuffer, bufferInterval);
    }
  }, [bufferInterval, maxBufferSize, flushBuffer]);

  /**
   * Clear buffer
   */
  const clearBuffer = useCallback(() => {
    messageBuffer.current = [];
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      // Flush any remaining messages
      if (messageBuffer.current.length > 0) {
        flushBuffer();
      }
    };
  }, [flushBuffer]);

  return {
    handleMessage,
    messageCount: messageCountRef.current,
    clearBuffer,
  };
}

/**
 * Hook for batched state updates to prevent excessive re-renders
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  batchInterval: number = 300
): [T, (updater: (prev: T) => T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const pendingUpdateRef = useRef<((prev: T) => T) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setBatchedValue = useCallback((updater: (prev: T) => T) => {
    // Store the latest updater
    pendingUpdateRef.current = (prev: T) => {
      // Apply previous pending update first (if any)
      const intermediate = pendingUpdateRef.current 
        ? pendingUpdateRef.current(prev)
        : prev;
      // Then apply new update
      return updater(intermediate);
    };

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Schedule batched update
    timerRef.current = setTimeout(() => {
      if (pendingUpdateRef.current) {
        setValue(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      timerRef.current = null;
    }, batchInterval);
  }, [batchInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Apply pending update immediately on unmount
        if (pendingUpdateRef.current) {
          setValue(pendingUpdateRef.current);
        }
      }
    };
  }, []);

  return [value, setBatchedValue];
}
