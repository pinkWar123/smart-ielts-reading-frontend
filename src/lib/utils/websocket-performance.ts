import type { WebSocketMessage } from '../types/websocket';

/**
 * Message buffer for batching WebSocket messages
 */
export class MessageBuffer {
  private buffer: WebSocketMessage[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private flushInterval: number;
  private maxBufferSize: number;
  private onFlush: (messages: WebSocketMessage[]) => void;

  constructor(
    onFlush: (messages: WebSocketMessage[]) => void,
    flushInterval = 500,
    maxBufferSize = 50
  ) {
    this.onFlush = onFlush;
    this.flushInterval = flushInterval;
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Add a message to the buffer
   */
  add(message: WebSocketMessage): void {
    this.buffer.push(message);

    // Flush immediately if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    } else {
      this._scheduleFlush();
    }
  }

  /**
   * Flush the buffer immediately
   */
  flush(): void {
    if (this.buffer.length === 0) return;

    const messages = [...this.buffer];
    this.buffer = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.onFlush(messages);
  }

  /**
   * Schedule a flush
   */
  private _scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get current buffer size
   */
  size(): number {
    return this.buffer.length;
  }
}

/**
 * Throttle function calls
 */
export class Throttle {
  private lastCallTime = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;
  private func: (...args: any[]) => void;

  constructor(func: (...args: any[]) => void, delay: number) {
    this.func = func;
    this.delay = delay;
  }

  /**
   * Call the throttled function
   */
  call(...args: any[]): void {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall >= this.delay) {
      this.lastCallTime = now;
      this.func(...args);
    } else {
      // Schedule for later
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        this.lastCallTime = Date.now();
        this.func(...args);
        this.timeoutId = null;
      }, this.delay - timeSinceLastCall);
    }
  }

  /**
   * Cancel any pending calls
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Debounce function calls
 */
export class Debounce {
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;
  private func: (...args: any[]) => void;

  constructor(func: (...args: any[]) => void, delay: number) {
    this.func = func;
    this.delay = delay;
  }

  /**
   * Call the debounced function
   */
  call(...args: any[]): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.func(...args);
      this.timeoutId = null;
    }, this.delay);
  }

  /**
   * Cancel any pending calls
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Flush immediately
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.func();
      this.timeoutId = null;
    }
  }
}

/**
 * Message deduplicator to prevent duplicate processing
 */
export class MessageDeduplicator {
  private processedIds = new Set<string>();
  private maxSize: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(maxSize = 1000, cleanupInterval = 60000) {
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this._startCleanup();
  }

  /**
   * Check if message has been processed
   */
  isDuplicate(messageId: string): boolean {
    return this.processedIds.has(messageId);
  }

  /**
   * Mark message as processed
   */
  markProcessed(messageId: string): void {
    this.processedIds.add(messageId);

    // Cleanup if size exceeds max
    if (this.processedIds.size > this.maxSize) {
      this._cleanup();
    }
  }

  /**
   * Start periodic cleanup
   */
  private _startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this._cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Cleanup old entries
   */
  private _cleanup(): void {
    if (this.processedIds.size > this.maxSize) {
      // Remove oldest half of entries
      const toRemove = Math.floor(this.processedIds.size / 2);
      const iterator = this.processedIds.values();
      
      for (let i = 0; i < toRemove; i++) {
        const next = iterator.next();
        if (!next.done) {
          this.processedIds.delete(next.value);
        }
      }
    }
  }

  /**
   * Clear all processed IDs
   */
  clear(): void {
    this.processedIds.clear();
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

/**
 * Rate limiter for WebSocket messages
 */
export class MessageRateLimiter {
  private messageCount = 0;
  private windowStart = Date.now();
  private maxMessages: number;
  private windowMs: number;

  constructor(maxMessages: number, windowMs: number) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
  }

  /**
   * Check if message should be allowed
   */
  allowMessage(): boolean {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart >= this.windowMs) {
      this.messageCount = 0;
      this.windowStart = now;
    }

    // Check if under limit
    if (this.messageCount < this.maxMessages) {
      this.messageCount++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining messages in current window
   */
  getRemainingMessages(): number {
    return Math.max(0, this.maxMessages - this.messageCount);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.messageCount = 0;
    this.windowStart = Date.now();
  }
}

/**
 * Priority queue for message processing
 */
export class MessagePriorityQueue {
  private queues: Map<number, WebSocketMessage[]> = new Map();
  private priorities = [1, 2, 3, 4, 5]; // 1 = highest priority

  /**
   * Add message to queue with priority
   */
  enqueue(message: WebSocketMessage, priority: number = 3): void {
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(message);
  }

  /**
   * Get next message from queue (highest priority first)
   */
  dequeue(): WebSocketMessage | null {
    for (const priority of this.priorities) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }

  /**
   * Get message priority based on type
   */
  static getPriority(message: WebSocketMessage): number {
    switch (message.type) {
      case 'error':
      case 'session_completed':
        return 1; // Highest priority
      case 'violation':
      case 'student_submitted':
        return 2;
      case 'student_answer':
      case 'participant_joined':
      case 'participant_disconnected':
        return 3;
      case 'student_progress':
      case 'session_stats':
        return 4;
      case 'student_highlight':
        return 5; // Lowest priority
      default:
        return 3; // Default priority
    }
  }

  /**
   * Get total size of all queues
   */
  size(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.queues.clear();
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }
}

/**
 * UI update throttler to prevent excessive re-renders
 */
export class UIUpdateThrottler {
  private pendingUpdate: (() => void) | null = null;
  private isScheduled = false;
  private rafId: number | null = null;

  /**
   * Schedule a UI update
   */
  schedule(updateFn: () => void): void {
    this.pendingUpdate = updateFn;

    if (!this.isScheduled) {
      this.isScheduled = true;
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingUpdate) {
          this.pendingUpdate();
          this.pendingUpdate = null;
        }
        this.isScheduled = false;
        this.rafId = null;
      });
    }
  }

  /**
   * Cancel any pending update
   */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = null;
    this.isScheduled = false;
  }
}
