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

export type ClassStatus = 'ACTIVE' | 'ARCHIVED';

export type SessionStatus = 
  | 'SCHEDULED' 
  | 'WAITING_FOR_STUDENTS' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface Class {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  student_ids: string[];
  status: ClassStatus;
  created_at: string;
  updated_at: string | null;
}

export interface CreateClassRequest {
  name: string;
  description?: string | null;
}

export interface UpdateClassRequest {
  name?: string;
  description?: string | null;
}

export interface SessionParticipant {
  student_id: string;
  attempt_id: string | null;
  joined_at: string | null;
  connection_status: 'CONNECTED' | 'DISCONNECTED';
  last_activity: string | null;
}

export interface Session {
  id: string;
  class_id: string;
  test_id: string;
  title: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: SessionStatus;
  participants: SessionParticipant[];
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface CreateSessionRequest {
  class_id: string;
  test_id: string;
  title: string;
  scheduled_at: string; // ISO datetime string
}

export interface ParticipantStats {
  student_id: string;
  student_name: string;
  attempt_id: string | null;
  connection_status: 'CONNECTED' | 'DISCONNECTED';
  progress: {
    passage_index: number;
    question_index: number;
  } | null;
  answers_submitted: number;
  tab_violations: number;
  last_activity: string | null;
  joined_at: string | null;
}

export interface SessionStats {
  session_id: string;
  total_students: number;
  connected_students: number;
  disconnected_students: number;
  average_progress: {
    passage_index: number;
    question_index: number;
  } | null;
  total_answers_submitted: number;
  total_tab_violations: number;
  participants: ParticipantStats[];
  time_remaining: number | null; // seconds remaining, null if not started
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'STUDENT' | 'TEACHER';
}

export interface EnrollStudentRequest {
  student_id: string;
}

// ==================== API Functions ====================

export const sessionsApi = {
  /**
   * Get all classes (admin/teacher)
   */
  async getAllClasses(): Promise<Class[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/classes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Class[]>(response);
  },

  /**
   * Get class by ID
   */
  async getClassById(classId: string): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/api/v1/classes/${classId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Class>(response);
  },

  /**
   * Create a new class
   */
  async createClass(data: CreateClassRequest): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/api/v1/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<Class>(response);
  },

  /**
   * Update a class
   */
  async updateClass(classId: string, data: UpdateClassRequest): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/api/v1/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<Class>(response);
  },

  /**
   * Archive (delete) a class
   */
  async deleteClass(classId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || 'Failed to delete class',
        response.status,
        errorData.code
      );
    }
  },

  /**
   * Enroll a student in a class
   */
  async enrollStudent(classId: string, studentId: string): Promise<Class> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/classes/${classId}/students`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ student_id: studentId }),
      }
    );

    return handleResponse<Class>(response);
  },

  /**
   * Remove a student from a class
   */
  async removeStudent(classId: string, studentId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/classes/${classId}/students/${studentId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || 'Failed to remove student',
        response.status,
        errorData.code
      );
    }
  },

  /**
   * Get all students (for enrollment)
   */
  async getAllStudents(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users?role=STUDENT`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<User[]>(response);
  },

  /**
   * Get all sessions (admin)
   */
  async getAllSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Session[]>(response);
  },

  /**
   * Get my sessions (student)
   */
  async getMySessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/my-sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Session[]>(response);
  },

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<Session>(response);
  },

  /**
   * Create a new session
   */
  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<Session>(response);
  },

  /**
   * Start waiting phase (open waiting room)
   */
  async startWaitingPhase(sessionId: string): Promise<Session> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/sessions/${sessionId}/start-waiting`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<Session>(response);
  },

  /**
   * Start session (begin countdown)
   */
  async startSession(sessionId: string): Promise<Session> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/sessions/${sessionId}/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<Session>(response);
  },

  /**
   * Complete session (force complete)
   */
  async completeSession(sessionId: string): Promise<Session> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/sessions/${sessionId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<Session>(response);
  },

  /**
   * Delete session (admin only)
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || 'Failed to delete session',
        response.status,
        errorData.code
      );
    }
  },

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/sessions/${sessionId}/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<SessionStats>(response);
  },
};

export default sessionsApi;

