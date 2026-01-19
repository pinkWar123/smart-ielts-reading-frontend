import { create } from 'zustand';
import {
  sessionsApi,
  type Session,
  type CreateSessionRequest,
  type SessionStats,
} from '../api/sessions';

interface SessionStore {
  // State
  sessions: Session[];
  currentSession: Session | null;
  sessionStats: SessionStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
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
  currentSession: null,
  sessionStats: null,
  loading: false,
  error: null,

  // Fetch all sessions (admin)
  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await sessionsApi.getAllSessions();
      set({ sessions, loading: false });
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
      const sessions = await sessionsApi.getMySessions();
      set({ sessions, loading: false });
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

      // Update in sessions list if exists
      const sessions = get().sessions;
      const index = sessions.findIndex((s) => s.id === sessionId);
      if (index >= 0) {
        sessions[index] = session;
        set({ sessions: [...sessions] });
      }
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
      set((state) => ({
        sessions: [...state.sessions, newSession],
        loading: false,
      }));
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
      set((state) => {
        const sessions = state.sessions.map((s) =>
          s.id === sessionId ? updatedSession : s
        );
        const currentSession =
          state.currentSession?.id === sessionId ? updatedSession : state.currentSession;
        return { sessions, currentSession, loading: false };
      });
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
      set((state) => {
        const sessions = state.sessions.map((s) =>
          s.id === sessionId ? updatedSession : s
        );
        const currentSession =
          state.currentSession?.id === sessionId ? updatedSession : state.currentSession;
        return { sessions, currentSession, loading: false };
      });
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
      set((state) => {
        const sessions = state.sessions.map((s) =>
          s.id === sessionId ? updatedSession : s
        );
        const currentSession =
          state.currentSession?.id === sessionId ? updatedSession : state.currentSession;
        return { sessions, currentSession, loading: false };
      });
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
      set((state) => {
        const sessions = state.sessions.filter((s) => s.id !== sessionId);
        const currentSession =
          state.currentSession?.id === sessionId ? null : state.currentSession;
        return { sessions, currentSession, loading: false };
      });
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

