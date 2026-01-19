import type { Question } from '../types/question';
import type { StudentAnswer, TestResult } from '../types/test';

/**
 * Normalize answer for comparison (lowercase, trim, remove extra spaces)
 */
const normalizeAnswer = (answer: string): string => {
  return answer.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Check if a single answer is correct
 */
export const checkAnswer = (
  question: Question,
  studentAnswer: string | string[]
): boolean => {
  const correctAnswer = question.answer;

  // Handle array answers (multiple correct answers possible)
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(studentAnswer)) return false;

    // Check if all student answers are correct
    return studentAnswer.every(ans =>
      correctAnswer.some(correct =>
        normalizeAnswer(correct) === normalizeAnswer(ans)
      )
    );
  }

  // Handle single answer
  const studentAns = Array.isArray(studentAnswer) ? studentAnswer[0] : studentAnswer;

  if (!studentAns) return false;

  return normalizeAnswer(correctAnswer) === normalizeAnswer(studentAns);
};

/**
 * Calculate test score from student answers
 */
export const calculateScore = (
  questions: Question[],
  studentAnswers: StudentAnswer[]
): TestResult => {
  let correctCount = 0;

  const answersWithCorrectness = studentAnswers.map(studentAnswer => {
    const question = questions.find(q => q.id === studentAnswer.questionId);

    if (!question) {
      return { ...studentAnswer, isCorrect: false };
    }

    const isCorrect = checkAnswer(question, studentAnswer.answer);
    if (isCorrect) correctCount++;

    return {
      ...studentAnswer,
      isCorrect,
    };
  });

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const bandScore = convertScoreToBandScore(correctCount, totalQuestions);

  return {
    attemptId: '', // Will be set by caller
    testId: '', // Will be set by caller
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: totalQuestions - correctCount,
    score,
    bandScore,
    answers: answersWithCorrectness,
    tabSwitchCount: 0, // Will be set by caller
    timeSpent: 0, // Will be set by caller
  };
};

/**
 * Convert raw score to IELTS band score
 * Based on IELTS Reading band score conversion chart
 */
export const convertScoreToBandScore = (
  correctAnswers: number,
  totalQuestions: number
): number => {
  // Standard IELTS reading conversion (Academic)
  // This is an approximation - actual conversion may vary
  const percentage = (correctAnswers / totalQuestions) * 100;

  if (percentage >= 97.5) return 9.0;
  if (percentage >= 95) return 8.5;
  if (percentage >= 90) return 8.0;
  if (percentage >= 85) return 7.5;
  if (percentage >= 75) return 7.0;
  if (percentage >= 65) return 6.5;
  if (percentage >= 55) return 6.0;
  if (percentage >= 45) return 5.5;
  if (percentage >= 35) return 5.0;
  if (percentage >= 25) return 4.5;
  if (percentage >= 20) return 4.0;
  if (percentage >= 15) return 3.5;
  if (percentage >= 10) return 3.0;
  if (percentage >= 5) return 2.5;
  return 2.0;
};

/**
 * Get band score description
 */
export const getBandScoreDescription = (bandScore: number): string => {
  if (bandScore >= 9) return 'Expert User';
  if (bandScore >= 8) return 'Very Good User';
  if (bandScore >= 7) return 'Good User';
  if (bandScore >= 6) return 'Competent User';
  if (bandScore >= 5) return 'Modest User';
  if (bandScore >= 4) return 'Limited User';
  if (bandScore >= 3) return 'Extremely Limited User';
  return 'Non User';
};

