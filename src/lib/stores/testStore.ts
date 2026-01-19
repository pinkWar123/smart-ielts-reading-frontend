import { create } from 'zustand';
import type { Test, TestAttempt, StudentAnswer } from '../types/test';
import type { Question } from '../types/question';

interface TestStore {
  // Current test state
  currentTest: Test | null;
  currentAttempt: TestAttempt | null;
  currentPassageIndex: number;
  answers: Map<string, string | string[]>; // questionId -> answer

  // Tab switching detection
  tabSwitchCount: number;
  tabSwitchTimestamps: Date[];

  // Timer
  startTime: Date | null;
  timeRemaining: number; // in seconds

  // Actions
  startTest: (test: Test, studentId: string, studentName: string) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  goToPassage: (index: number) => void;
  recordTabSwitch: () => void;
  submitTest: () => StudentAnswer[];
  resetTest: () => void;
  setTimeRemaining: (time: number) => void;
}

export const useTestStore = create<TestStore>((set, get) => ({
  currentTest: null,
  currentAttempt: null,
  currentPassageIndex: 0,
  answers: new Map(),
  tabSwitchCount: 0,
  tabSwitchTimestamps: [],
  startTime: null,
  timeRemaining: 0,

  startTest: (test, studentId, studentName) => {
    const attempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId: test.id,
      studentId,
      studentName,
      startedAt: new Date(),
      answers: [],
      tabSwitchCount: 0,
      tabSwitchTimestamps: [],
    };

    set({
      currentTest: test,
      currentAttempt: attempt,
      currentPassageIndex: 0,
      answers: new Map(),
      tabSwitchCount: 0,
      tabSwitchTimestamps: [],
      startTime: new Date(),
      timeRemaining: test.timeLimit * 60, // convert to seconds
    });
  },

  setAnswer: (questionId, answer) => {
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);
      return { answers: newAnswers };
    });
  },

  goToPassage: (index) => {
    set({ currentPassageIndex: index });
  },

  recordTabSwitch: () => {
    set((state) => ({
      tabSwitchCount: state.tabSwitchCount + 1,
      tabSwitchTimestamps: [...state.tabSwitchTimestamps, new Date()],
    }));
  },

  submitTest: () => {
    const state = get();
    const { currentTest, answers } = state;

    if (!currentTest) return [];

    // Collect all questions from all passages
    const allQuestions: Question[] = [];
    currentTest.passages.forEach(passage => {
      passage.questionGroups.forEach(group => {
        allQuestions.push(...group.questions);
      });
    });

    // Convert answers Map to StudentAnswer array
    const studentAnswers: StudentAnswer[] = allQuestions.map(question => ({
      questionId: question.id,
      questionNumber: question.questionNumber,
      answer: answers.get(question.id) || '',
    }));

    return studentAnswers;
  },

  resetTest: () => {
    set({
      currentTest: null,
      currentAttempt: null,
      currentPassageIndex: 0,
      answers: new Map(),
      tabSwitchCount: 0,
      tabSwitchTimestamps: [],
      startTime: null,
      timeRemaining: 0,
    });
  },

  setTimeRemaining: (time) => {
    set({ timeRemaining: time });
  },
}));

