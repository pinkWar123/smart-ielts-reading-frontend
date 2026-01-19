import { create } from 'zustand';
import { attemptsApi, type Attempt, type TextHighlight } from '../api/attempts';
import type { Test } from '../types/test';

interface SessionAttemptStore {
  // State
  attemptId: string | null;
  sessionId: string | null;
  testData: Test | null;
  answers: Map<string, string | string[]>; // questionId -> answer
  highlights: TextHighlight[];
  progress: { passageIndex: number; questionIndex: number } | null;
  timeRemaining: number | null; // seconds, from server
  tabViolations: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

  // Actions
  initializeAttempt: (attemptId: string, sessionId: string, testData: Test) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  recordHighlight: (highlight: TextHighlight) => void;
  updateProgress: (passageIndex: number, questionIndex: number) => void;
  recordTabViolation: () => void;
  syncState: (attempt: Attempt) => void;
  setTimeRemaining: (seconds: number | null) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting') => void;
  submitAttempt: () => Promise<void>;
  resetAttempt: () => void;
}

export const useSessionAttemptStore = create<SessionAttemptStore>((set, get) => ({
  // Initial state
  attemptId: null,
  sessionId: null,
  testData: null,
  answers: new Map(),
  highlights: [],
  progress: null,
  timeRemaining: null,
  tabViolations: 0,
  connectionStatus: 'disconnected',

  // Initialize attempt
  initializeAttempt: (attemptId, sessionId, testData) => {
    set({
      attemptId,
      sessionId,
      testData,
      answers: new Map(),
      highlights: [],
      progress: { passageIndex: 0, questionIndex: 0 },
      timeRemaining: null,
      tabViolations: 0,
      connectionStatus: 'disconnected',
    });
  },

  // Set answer
  setAnswer: (questionId, answer) => {
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);
      return { answers: newAnswers };
    });
  },

  // Record text highlight
  recordHighlight: (highlight) => {
    set((state) => ({
      highlights: [...state.highlights, highlight],
    }));
  },

  // Update progress
  updateProgress: (passageIndex, questionIndex) => {
    set({
      progress: { passageIndex, questionIndex },
    });
  },

  // Record tab violation
  recordTabViolation: () => {
    set((state) => ({
      tabViolations: state.tabViolations + 1,
    }));
  },

  // Sync state from server (on reconnect)
  syncState: (attempt) => {
    // Convert answers object to Map
    const answersMap = new Map<string, string | string[]>();
    Object.entries(attempt.answers || {}).forEach(([questionId, answer]) => {
      answersMap.set(questionId, answer);
    });

    set({
      attemptId: attempt.id,
      answers: answersMap,
      highlights: attempt.highlighted_text || [],
      progress: attempt.progress,
      timeRemaining: attempt.time_remaining,
      tabViolations: attempt.tab_violations || 0,
    });
  },

  // Set time remaining (from server)
  setTimeRemaining: (seconds) => {
    set({ timeRemaining: seconds });
  },

  // Set connection status
  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  // Submit attempt
  submitAttempt: async () => {
    const { attemptId } = get();
    if (!attemptId) {
      throw new Error('No attempt to submit');
    }

    try {
      await attemptsApi.submitAttempt(attemptId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit attempt';
      throw new Error(message);
    }
  },

  // Reset attempt
  resetAttempt: () => {
    set({
      attemptId: null,
      sessionId: null,
      testData: null,
      answers: new Map(),
      highlights: [],
      progress: null,
      timeRemaining: null,
      tabViolations: 0,
      connectionStatus: 'disconnected',
    });
  },
}));

