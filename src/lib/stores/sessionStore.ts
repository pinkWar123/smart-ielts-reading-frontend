import { create } from 'zustand';
import {
  sessionsApi,
  type Session,
  type SessionSummaryDTO,
  type StudentSessionDTO,
  type CreateSessionRequest,
  type SessionStats,
} from '../api/sessions';
import type { PaginationMeta } from '../api/tests';

interface SessionStore {
  // State
  sessions: SessionSummaryDTO[];
  studentSessions: StudentSessionDTO[];
  currentSession: Session | null;
  sessionStats: SessionStats | null;
  paginationMeta: PaginationMeta | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (teacherId?: string, classId?: string) => Promise<void>;
  fetchMySessions: () => Promise<void>;
  fetchSessionById: (sessionId: string) => Promise<void>;
  createSession: (data: CreateSessionRequest) => Promise<Session>;
  startWaitingPhase: (sessionId: string) => Promise<Session>;
  startSession: (sessionId: string) => Promise<Session>;
  completeSession: (sessionId: string) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  fetchSessionStats: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  sessions: [],
  studentSessions: [],
  currentSession: null,
  sessionStats: null,
  paginationMeta: null,
  loading: false,
  error: null,

  // Fetch all sessions (admin/teacher)
  fetchSessions: async (teacherId?: string, classId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await sessionsApi.getAllSessions(
        1, 
        10, 
        'created_at', 
        'desc',
        teacherId,
        classId
      );
      set({ 
        sessions: response.data,
        paginationMeta: response.meta,
        loading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Fetch my sessions (student)
  fetchMySessions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await sessionsApi.getMySessions(1, 100, 'created_at', 'desc');
      set({ 
        studentSessions: response.data,
        paginationMeta: response.meta,
        loading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch my sessions';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Fetch session by ID
  fetchSessionById: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const session = await sessionsApi.getSessionById(sessionId);
      set({ currentSession: session, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch session';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Create session
  createSession: async (data: CreateSessionRequest) => {
    set({ loading: true, error: null });
    try {
      const newSession = await sessionsApi.createSession(data);
      // Refresh the list to get updated paginated data
      await get().fetchSessions();
      return newSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Start waiting phase
  startWaitingPhase: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedSession = await sessionsApi.startWaitingPhase(sessionId);
      // Refresh the list to get updated data
      await get().fetchSessions();
      const currentSession = get().currentSession?.id === sessionId ? updatedSession : get().currentSession;
      set({ currentSession, loading: false });
      return updatedSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start waiting phase';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Start session
  startSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedSession = await sessionsApi.startSession(sessionId);
      // Refresh the list to get updated data
      await get().fetchSessions();
      const currentSession = get().currentSession?.id === sessionId ? updatedSession : get().currentSession;
      set({ currentSession, loading: false });
      return updatedSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Complete session
  completeSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedSession = await sessionsApi.completeSession(sessionId);
      // Refresh the list to get updated data
      await get().fetchSessions();
      const currentSession = get().currentSession?.id === sessionId ? updatedSession : get().currentSession;
      set({ currentSession, loading: false });
      return updatedSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete session';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      await sessionsApi.deleteSession(sessionId);
      // Refresh the list to get updated paginated data
      await get().fetchSessions();
      const currentSession = get().currentSession?.id === sessionId ? null : get().currentSession;
      set({ currentSession, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete session';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Fetch session statistics
  fetchSessionStats: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const stats = await sessionsApi.getSessionStats(sessionId);
      set({ sessionStats: stats, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch session stats';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Set current session
  setCurrentSession: (session: Session | null) => {
    set({ currentSession: session });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

