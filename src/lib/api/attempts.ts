import { useAuthStore } from '../stores/authStore';
import { ApiError, handleResponse } from './tests';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Helper to get auth token
const getAuthHeader = (): Record<string, string> => {
  const token = useAuthStore.getState().getAccessToken();
  if (!token) {
    throw new ApiError('Authentication required', 401);
  }
  return { Authorization: `Bearer ${token}` };
};

// ==================== Types ====================

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';

export interface TextHighlight {
  timestamp: string; // ISO datetime string
  text: string;
  passage_id: string;
  position_start: number;
  position_end: number;
}

export interface AnswerSubmission {
  question_id: string;
  answer: string | string[];
}

export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  session_id: string | null;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, string | string[]>; // question_id -> answer
  highlighted_text: TextHighlight[];
  tab_violations: number;
  tab_violation_timestamps: string[];
  progress: {
    passage_index: number;
    question_index: number;
  } | null;
  time_remaining: number | null; // seconds
  created_at: string;
  updated_at: string | null;
}

export interface SubmitAnswerRequest {
  question_id: string;
  answer: string | string[];
}

export interface RecordHighlightRequest {
  text: string;
  passage_id: string;
  position_start: number;
  position_end: number;
}

export interface UpdateProgressRequest {
  passage_index: number;
  question_index: number;
}

// ==================== API Functions ====================

export const attemptsApi = {
  /**
   * Get attempt by ID (for state sync on reconnect)
   */
  async getAttemptById(attemptId: string): Promise<Attempt> {
    const response = await fetch(`${API_BASE_URL}/api/v1/attempts/${attemptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Attempt>(response);
  },

  /**
   * Submit or update an answer
   */
  async submitAnswer(
    attemptId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<Attempt> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/${attemptId}/answers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          question_id: questionId,
          answer,
        }),
      }
    );

    return handleResponse<Attempt>(response);
  },

  /**
   * Submit final attempt
   */
  async submitAttempt(attemptId: string): Promise<Attempt> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<Attempt>(response);
  },

  /**
   * Record tab violation
   */
  async recordTabViolation(attemptId: string): Promise<Attempt> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/${attemptId}/tab-violation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<Attempt>(response);
  },

  /**
   * Record text highlight
   */
  async recordTextHighlight(
    attemptId: string,
    data: RecordHighlightRequest
  ): Promise<Attempt> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/${attemptId}/highlight`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      }
    );

    return handleResponse<Attempt>(response);
  },

  /**
   * Update progress (current passage/question position)
   */
  async updateProgress(
    attemptId: string,
    passageIndex: number,
    questionIndex: number
  ): Promise<Attempt> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/attempts/${attemptId}/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          passage_index: passageIndex,
          question_index: questionIndex,
        }),
      }
    );

    return handleResponse<Attempt>(response);
  },
};

export default attemptsApi;

