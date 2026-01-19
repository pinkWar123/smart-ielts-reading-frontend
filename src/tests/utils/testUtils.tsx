import React, { ReactElement } from 'react';
import { render, RenderOptions, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSessionStore } from '@/lib/stores/sessionStore';
import type { Session } from '@/lib/api/sessions';

// ==================== Types ====================

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  route?: string;
}

// ==================== Mock Data ====================

export const mockUser = {
  user_id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'STUDENT' as const,
};

export const mockTeacher = {
  user_id: 'teacher-123',
  username: 'teacher',
  email: 'teacher@example.com',
  full_name: 'Test Teacher',
  role: 'ADMIN' as const,
};

export const mockSession: Session = {
  id: 'session-123',
  class_id: 'class-123',
  test_id: 'test-123',
  title: 'Test Session',
  scheduled_at: new Date().toISOString(),
  started_at: null,
  completed_at: null,
  status: 'SCHEDULED',
  participants: [
    {
      student_id: 'user-123',
      attempt_id: 'attempt-123',
      joined_at: new Date().toISOString(),
      connection_status: 'CONNECTED',
      last_activity: new Date().toISOString(),
    },
  ],
  created_by: 'teacher-123',
  created_at: new Date().toISOString(),
  updated_at: null,
};

export const mockSessionInProgress: Session = {
  ...mockSession,
  status: 'IN_PROGRESS',
  started_at: new Date().toISOString(),
};

export const mockSessionWaiting: Session = {
  ...mockSession,
  status: 'WAITING_FOR_STUDENTS',
};

// ==================== Auth Store Setup ====================

export function setupMockAuth(user = mockUser, token = 'mock-jwt-token') {
  useAuthStore.setState({
    user,
    accessToken: token,
    refreshToken: 'mock-refresh-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    getAccessToken: () => token,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    refreshTokens: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
  });
}

export function setupMockTeacherAuth() {
  setupMockAuth(mockTeacher, 'mock-teacher-jwt-token');
}

export function clearMockAuth() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

// ==================== Session Store Setup ====================

export function setupMockSession(session = mockSession) {
  useSessionStore.setState({
    sessions: [session],
    currentSession: session,
    sessionStats: null,
    loading: false,
    error: null,
  });
}

export function clearMockSession() {
  useSessionStore.setState({
    sessions: [],
    currentSession: null,
    sessionStats: null,
    loading: false,
    error: null,
  });
}

// ==================== Router Wrappers ====================

function createWrapper(options: CustomRenderOptions = {}) {
  const { initialEntries = ['/'] } = options;

  return function Wrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    );
  };
}

// ==================== Custom Render Functions ====================

export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const Wrapper = createWrapper(options);
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export function renderWithRoute(
  ui: ReactElement,
  route: string,
  path: string,
  options: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: WrapperProps) => (
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// ==================== Test Utilities ====================

export async function waitForWebSocketConnection(timeout = 5000): Promise<void> {
  await waitFor(
    () => {
      const ws = (globalThis as any)._mockWebSocket;
      if (!ws || ws.readyState !== 1) {
        throw new Error('WebSocket not connected');
      }
    },
    { timeout }
  );
}

export function createDelayedPromise<T>(value: T, delay = 100): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Sleep utility for timing-sensitive tests
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Assertion Helpers ====================

export function expectNoConsoleErrors(consoleErrorSpy: ReturnType<typeof vi.spyOn>) {
  const errors = consoleErrorSpy.mock.calls.filter(
    (call) =>
      !String(call[0]).includes('Warning:') &&
      !String(call[0]).includes('WebSocket')
  );
  expect(errors).toHaveLength(0);
}

// ==================== DOM Event Helpers ====================

export function createVisibilityChangeEvent(hidden: boolean) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  });
  
  document.dispatchEvent(new Event('visibilitychange'));
}

export function createBlurEvent() {
  window.dispatchEvent(new Event('blur'));
}

export function createFocusEvent() {
  window.dispatchEvent(new Event('focus'));
}

export function createCopyEvent(text = '') {
  // Use Event as fallback if ClipboardEvent is not available
  const ClipboardEventClass = (globalThis as any).ClipboardEvent || Event;
  const DataTransferClass = (globalThis as any).DataTransfer;
  
  let clipboardData = null;
  if (DataTransferClass) {
    clipboardData = new DataTransferClass();
  }
  
  const event = new ClipboardEventClass('copy', {
    bubbles: true,
    cancelable: true,
    clipboardData,
  });
  document.dispatchEvent(event);
  return event;
}

export function createPasteEvent(text = '') {
  const ClipboardEventClass = (globalThis as any).ClipboardEvent || Event;
  const DataTransferClass = (globalThis as any).DataTransfer;
  
  let clipboardData = null;
  if (DataTransferClass) {
    clipboardData = new DataTransferClass();
    clipboardData.setData('text/plain', text);
  }
  
  const event = new ClipboardEventClass('paste', { 
    bubbles: true,
    cancelable: true,
    clipboardData,
  });
  document.dispatchEvent(event);
  return event;
}

export function createContextMenuEvent(target: Element = document.body) {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

export function createKeyDownEvent(key: string, modifiers: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrlKey || false,
    metaKey: modifiers.metaKey || false,
    shiftKey: modifiers.shiftKey || false,
    bubbles: true,
  });
  document.dispatchEvent(event);
  return event;
}

export function simulateTextSelection(text: string, startOffset = 0, endOffset?: number) {
  // Create a mock selection
  const selection = window.getSelection();
  if (!selection) return;

  // Create a text node with the content
  const textNode = document.createTextNode(text);
  const container = document.createElement('div');
  container.appendChild(textNode);
  document.body.appendChild(container);

  // Create range
  const range = document.createRange();
  range.setStart(textNode, startOffset);
  range.setEnd(textNode, endOffset ?? text.length);

  // Add to selection
  selection.removeAllRanges();
  selection.addRange(range);

  return { container, range, selection };
}

export function clearTextSelection() {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

// ==================== Timer Utilities ====================

export function advanceTimers(ms: number) {
  vi.advanceTimersByTime(ms);
}

export async function advanceTimersAsync(ms: number) {
  vi.advanceTimersByTime(ms);
  await flushPromises();
}
