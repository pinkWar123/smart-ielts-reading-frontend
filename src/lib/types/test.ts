import type { Passage } from './passage';

export const TestType = {
  FULL_TEST: 'FULL_TEST', // 3 passages, ~40 questions
  SINGLE_PASSAGE: 'SINGLE_PASSAGE', // 1 passage
} as const;

export type TestType = typeof TestType[keyof typeof TestType];

export interface Test {
  id: string;
  title: string;
  type: TestType;
  description?: string;
  passages: Passage[];
  totalQuestions: number;
  timeLimit: number; // in minutes, typically 60 for full test, 20 for single passage
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  startedAt: Date;
  submittedAt?: Date;
  answers: StudentAnswer[];
  score?: number;
  tabSwitchCount: number;
  tabSwitchTimestamps: Date[];
}

export interface StudentAnswer {
  questionId: string;
  questionNumber: number;
  answer: string | string[];
  isCorrect?: boolean;
}

export interface TestResult {
  attemptId: string;
  testId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number; // percentage
  bandScore?: number; // IELTS band score (1-9)
  answers: StudentAnswer[];
  tabSwitchCount: number;
  timeSpent: number; // in minutes
}

