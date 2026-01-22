import { useAuthStore } from '../stores/authStore';
import { ApiError, handleResponse, type PaginationMeta } from './tests';

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

// User info structure
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'TEACHER';
  full_name: string;
}

// Class detail (from GET /classes/{id})
export interface Class {
  id: string;
  name: string;
  description: string | null;
  status: ClassStatus;
  teachers: UserInfo[];
  students: UserInfo[];
  created_at: string;
  created_by: UserInfo;
  updated_at: string | null;
}

// Class list item (for paginated list view)
export interface ClassListItem {
  id: string;
  name: string;
  description: string | null;
  students_count: number;
  status: ClassStatus;
  created_at: string;
  created_by: {
    id: string;
    username: string;
  };
}

// Paginated classes response
export interface GetPaginatedClassesResponse {
  data: ClassListItem[];
  meta: PaginationMeta;
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

// Session summary (for paginated list view - admin/teacher)
export interface SessionSummaryDTO {
  id: string;
  class_id: string;
  test_id: string;
  title: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: SessionStatus;
  participant_count: number;
  created_by: string;
  created_at: string;
}

// Student session summary (for student's my-sessions view)
export interface StudentSessionDTO {
  id: string;
  class_id: string;
  test_id: string;
  title: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: SessionStatus;
  my_attempt_id: string | null;
  my_joined_at: string | null;
  my_connection_status: string | null;
  created_at: string;
}

// Paginated sessions response (admin/teacher)
export interface GetPaginatedSessionsResponse {
  data: SessionSummaryDTO[];
  meta: PaginationMeta;
}

// Paginated student sessions response
export interface GetMySessionsResponse {
  data: StudentSessionDTO[];
  meta: PaginationMeta;
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

// Deprecated: Use UserInfo instead
export type User = UserInfo;

// Query users response
export interface QueryUsersResponse {
  users: UserInfo[];
}

export interface EnrollStudentRequest {
  student_id: string;
}

export interface AddTeacherRequest {
  teacher_id: string;
}

export interface AddStudentRequest {
  student_id: string;
}

// ==================== API Functions ====================

export const sessionsApi = {
  /**
   * Get all classes (admin/teacher)
   */
  async getAllClasses(
      page: number = 1,
      pageSize: number = 10,
      sortBy: string = 'created_at',
      sortOrder: 'asc' | 'desc' = 'desc',
      teacher_id: string | null = null
  ): Promise<GetPaginatedClassesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (teacher_id) {
      params.append('teacher_id', teacher_id);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/classes?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetPaginatedClassesResponse>(response);
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
  /**
   * Add teacher to class
   */
  async addTeacher(classId: string, teacherId: string): Promise<Class> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/classes/${classId}/teachers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ teacher_id: teacherId }),
      }
    );

    return handleResponse<Class>(response);
  },

  /**
   * Remove teacher from class
   */
  async removeTeacher(classId: string, teacherId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/classes/${classId}/teachers/${teacherId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }
    );

    return handleResponse<void>(response);
  },

  /**
   * Add student to class
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
  /**
   * Query users by role and search query
   */
  async queryUsers(role?: 'ADMIN' | 'TEACHER' | 'STUDENT', query?: string, limit: number = 10): Promise<QueryUsersResponse> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (query) params.append('q', query);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<QueryUsersResponse>(response);
  },

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
   * Get all sessions (admin/teacher) with pagination
   */
  async getAllSessions(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    teacherId?: string,
    classId?: string
  ): Promise<GetPaginatedSessionsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (teacherId) params.append('teacher_id', teacherId);
    if (classId) params.append('class_id', classId);

    const response = await fetch(`${API_BASE_URL}/api/v1/sessions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetPaginatedSessionsResponse>(response);
  },

  /**
   * Get my sessions (student) with pagination
   */
  async getMySessions(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<GetMySessionsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/my-sessions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetMySessionsResponse>(response);
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

