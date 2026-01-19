import type { Test, TestAttempt, TestResult } from '../types/test';
import type { Passage } from '../types/passage';

const STORAGE_KEYS = {
  TESTS: 'ielts_tests',
  PASSAGES: 'ielts_passages',
  ATTEMPTS: 'ielts_attempts',
} as const;

// Test API
export const getAllTests = (): Test[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TESTS);
  return data ? JSON.parse(data) : [];
};

export const getTestById = (id: string): Test | null => {
  const tests = getAllTests();
  return tests.find(test => test.id === id) || null;
};

export const createTest = (test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Test => {
  const tests = getAllTests();
  const newTest: Test = {
    ...test,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  tests.push(newTest);
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  return newTest;
};

export const updateTest = (id: string, updates: Partial<Test>): Test | null => {
  const tests = getAllTests();
  const index = tests.findIndex(test => test.id === id);

  if (index === -1) return null;

  tests[index] = {
    ...tests[index],
    ...updates,
    updatedAt: new Date(),
  };

  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  return tests[index];
};

export const deleteTest = (id: string): boolean => {
  const tests = getAllTests();
  const filtered = tests.filter(test => test.id !== id);

  if (filtered.length === tests.length) return false;

  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(filtered));
  return true;
};

// Passage API
export const getAllPassages = (): Passage[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PASSAGES);
  return data ? JSON.parse(data) : [];
};

export const getPassageById = (id: string): Passage | null => {
  const passages = getAllPassages();
  return passages.find(passage => passage.id === id) || null;
};

export const createPassage = (passage: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'>): Passage => {
  const passages = getAllPassages();
  const newPassage: Passage = {
    ...passage,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  passages.push(newPassage);
  localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(passages));
  return newPassage;
};

export const updatePassage = (id: string, updates: Partial<Passage>): Passage | null => {
  const passages = getAllPassages();
  const index = passages.findIndex(passage => passage.id === id);

  if (index === -1) return null;

  passages[index] = {
    ...passages[index],
    ...updates,
    updatedAt: new Date(),
  };

  localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(passages));
  return passages[index];
};

export const deletePassage = (id: string): boolean => {
  const passages = getAllPassages();
  const filtered = passages.filter(passage => passage.id !== id);

  if (filtered.length === passages.length) return false;

  localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(filtered));
  return true;
};

// Test Attempt API
export const getAllAttempts = (): TestAttempt[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  return data ? JSON.parse(data) : [];
};

export const getAttemptById = (id: string): TestAttempt | null => {
  const attempts = getAllAttempts();
  return attempts.find(attempt => attempt.id === id) || null;
};

export const createAttempt = (attempt: Omit<TestAttempt, 'id'>): TestAttempt => {
  const attempts = getAllAttempts();
  const newAttempt: TestAttempt = {
    ...attempt,
    id: crypto.randomUUID(),
  };
  attempts.push(newAttempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  return newAttempt;
};

export const updateAttempt = (id: string, updates: Partial<TestAttempt>): TestAttempt | null => {
  const attempts = getAllAttempts();
  const index = attempts.findIndex(attempt => attempt.id === id);

  if (index === -1) return null;

  attempts[index] = {
    ...attempts[index],
    ...updates,
  };

  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  return attempts[index];
};

export const getAttemptsByStudent = (studentId: string): TestAttempt[] => {
  const attempts = getAllAttempts();
  return attempts.filter(attempt => attempt.studentId === studentId);
};

export const getAttemptsByTest = (testId: string): TestAttempt[] => {
  const attempts = getAllAttempts();
  return attempts.filter(attempt => attempt.testId === testId);
};

