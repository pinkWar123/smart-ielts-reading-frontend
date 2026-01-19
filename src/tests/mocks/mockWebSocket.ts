import { vi, type Mock } from 'vitest';
import type {
  WebSocketMessage,
  WebSocketMessageType,
  SessionStatus,
  ViolationType,
} from '@/lib/types/websocket';

// ==================== Types ====================

export interface MockWebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: unknown;
}

export interface MockWebSocketOptions {
  autoConnect?: boolean;
  simulateLatency?: number;
  simulateErrors?: boolean;
}

// ==================== Mock WebSocket Class ====================

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  private _options: MockWebSocketOptions;
  private _messageQueue: MockWebSocketMessage[] = [];
  private _sentMessages: MockWebSocketMessage[] = [];
  private _closeCode: number | null = null;
  private _closeReason: string | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this._options = {};

    // Auto-connect after a short delay to simulate real WebSocket
    setTimeout(() => this._simulateOpen(), 10);
  }

  // Configure mock options
  _configure(options: MockWebSocketOptions): void {
    this._options = { ...this._options, ...options };
  }

  // Simulate connection opening
  _simulateOpen(): void {
    if (this.readyState === MockWebSocket.CONNECTING) {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }
  }

  // Simulate receiving a message from server
  _simulateReceiveMessage(message: MockWebSocketMessage): void {
    if (this.readyState !== MockWebSocket.OPEN) return;

    const delay = this._options.simulateLatency || 0;
    setTimeout(() => {
      if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
        const event = new MessageEvent('message', {
          data: JSON.stringify(message),
        });
        this.onmessage(event);
      }
    }, delay);
  }

  // Simulate receiving multiple messages
  _simulateReceiveMessages(messages: MockWebSocketMessage[]): void {
    messages.forEach((msg, index) => {
      setTimeout(() => {
        this._simulateReceiveMessage(msg);
      }, index * 50);
    });
  }

  // Simulate an error
  _simulateError(message?: string): void {
    if (this.onerror) {
      const error = new Event('error');
      this.onerror(error);
    }
  }

  // Simulate server closing the connection
  _simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this._closeCode = code;
    this._closeReason = reason;
    
    if (this.onclose) {
      const event = new CloseEvent('close', { code, reason, wasClean: code === 1000 });
      this.onclose(event);
    }
  }

  // Get sent messages for assertions
  _getSentMessages(): MockWebSocketMessage[] {
    return [...this._sentMessages];
  }

  // Get last sent message
  _getLastSentMessage(): MockWebSocketMessage | undefined {
    return this._sentMessages[this._sentMessages.length - 1];
  }

  // Clear sent messages
  _clearSentMessages(): void {
    this._sentMessages = [];
  }

  // Send message (client -> server)
  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    try {
      const message = JSON.parse(data);
      this._sentMessages.push(message);
      
      // Auto-respond to heartbeat with pong
      if (message.type === 'heartbeat') {
        setTimeout(() => {
          this._simulateReceiveMessage({
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
        }, this._options.simulateLatency || 10);
      }
    } catch (error) {
      // Handle non-JSON data
      this._sentMessages.push({ type: 'unknown' as WebSocketMessageType, data });
    }
  }

  // Close the connection
  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    
    setTimeout(() => {
      this._simulateClose(code || 1000, reason || 'Client closed');
    }, 10);
  }

  // Additional methods for protocol
  get protocol(): string {
    return '';
  }

  get bufferedAmount(): number {
    return 0;
  }

  get binaryType(): string {
    return 'blob';
  }

  set binaryType(value: string) {
    // noop
  }

  get extensions(): string {
    return '';
  }
}

// ==================== Mock WebSocket Server ====================

export class MockWebSocketServer {
  private _clients: Map<string, MockWebSocket> = new Map();
  private _messageLog: Array<{ clientId: string; message: MockWebSocketMessage }> = [];

  // Register a new WebSocket client
  registerClient(sessionId: string, ws: MockWebSocket): void {
    this._clients.set(sessionId, ws);
  }

  // Get client by session ID
  getClient(sessionId: string): MockWebSocket | undefined {
    return this._clients.get(sessionId);
  }

  // Broadcast message to all clients
  broadcast(message: MockWebSocketMessage): void {
    this._clients.forEach((client) => {
      client._simulateReceiveMessage(message);
    });
  }

  // Send message to specific client
  sendToClient(sessionId: string, message: MockWebSocketMessage): void {
    const client = this._clients.get(sessionId);
    if (client) {
      client._simulateReceiveMessage(message);
    }
  }

  // Disconnect a client
  disconnectClient(sessionId: string, code: number = 1000, reason?: string): void {
    const client = this._clients.get(sessionId);
    if (client) {
      client._simulateClose(code, reason);
      this._clients.delete(sessionId);
    }
  }

  // Disconnect all clients
  disconnectAll(code: number = 1000, reason?: string): void {
    this._clients.forEach((client, sessionId) => {
      client._simulateClose(code, reason);
    });
    this._clients.clear();
  }

  // Get all registered clients
  getAllClients(): MockWebSocket[] {
    return Array.from(this._clients.values());
  }

  // Clear all clients
  clear(): void {
    this._clients.clear();
    this._messageLog = [];
  }
}

// ==================== Message Factories ====================

export const createMockMessage = {
  connected(sessionId: string): MockWebSocketMessage {
    return {
      type: 'connected',
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };
  },

  pong(): MockWebSocketMessage {
    return {
      type: 'pong',
      timestamp: new Date().toISOString(),
    };
  },

  sessionStatusChanged(sessionId: string, status: SessionStatus): MockWebSocketMessage {
    return {
      type: 'session_status_changed',
      session_id: sessionId,
      status,
      timestamp: new Date().toISOString(),
    };
  },

  waitingRoomOpened(sessionId: string): MockWebSocketMessage {
    return {
      type: 'waiting_room_opened',
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };
  },

  sessionStarted(sessionId: string, connectedStudents: string[] = []): MockWebSocketMessage {
    return {
      type: 'session_started',
      session_id: sessionId,
      started_at: new Date().toISOString(),
      connected_students: connectedStudents,
      timestamp: new Date().toISOString(),
    };
  },

  sessionCompleted(sessionId: string): MockWebSocketMessage {
    return {
      type: 'session_completed',
      session_id: sessionId,
      completed_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  },

  participantJoined(
    sessionId: string,
    studentId: string,
    studentName: string,
    connectedCount: number
  ): MockWebSocketMessage {
    return {
      type: 'participant_joined',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      connected_count: connectedCount,
      timestamp: new Date().toISOString(),
    };
  },

  participantDisconnected(
    sessionId: string,
    studentId: string,
    studentName: string,
    connectedCount: number
  ): MockWebSocketMessage {
    return {
      type: 'participant_disconnected',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      connected_count: connectedCount,
      timestamp: new Date().toISOString(),
    };
  },

  studentProgress(
    sessionId: string,
    studentId: string,
    studentName: string,
    passageIndex: number,
    questionIndex: number,
    questionNumber: number
  ): MockWebSocketMessage {
    return {
      type: 'student_progress',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      passage_index: passageIndex,
      question_index: questionIndex,
      question_number: questionNumber,
      timestamp: new Date().toISOString(),
    };
  },

  studentAnswer(
    sessionId: string,
    studentId: string,
    studentName: string,
    questionId: string,
    questionNumber: number,
    answered: boolean,
    isUpdate: boolean = false
  ): MockWebSocketMessage {
    return {
      type: 'student_answer',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      question_id: questionId,
      question_number: questionNumber,
      answered,
      is_update: isUpdate,
      timestamp: new Date().toISOString(),
    };
  },

  studentHighlight(
    sessionId: string,
    studentId: string,
    studentName: string,
    passageIndex: number,
    text: string,
    startOffset: number = 0,
    endOffset: number = 50
  ): MockWebSocketMessage {
    return {
      type: 'student_highlight',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      passage_index: passageIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      highlighted_text: text.substring(0, 50),
      timestamp: new Date().toISOString(),
    };
  },

  violation(
    sessionId: string,
    studentId: string,
    studentName: string,
    violationType: ViolationType,
    totalCount: number
  ): MockWebSocketMessage {
    return {
      type: 'violation',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      violation_type: violationType,
      total_count: totalCount,
      timestamp: new Date().toISOString(),
    };
  },

  studentSubmitted(
    sessionId: string,
    studentId: string,
    studentName: string,
    score: number | null = null
  ): MockWebSocketMessage {
    return {
      type: 'student_submitted',
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      score,
      timestamp: new Date().toISOString(),
    };
  },

  sessionStats(
    sessionId: string,
    connectedStudents: number,
    disconnectedStudents: number,
    submittedStudents: number,
    averageProgress: number,
    totalViolations: number
  ): MockWebSocketMessage {
    return {
      type: 'session_stats',
      session_id: sessionId,
      connected_students: connectedStudents,
      disconnected_students: disconnectedStudents,
      submitted_students: submittedStudents,
      average_progress: averageProgress,
      total_violations: totalViolations,
      timestamp: new Date().toISOString(),
    };
  },

  error(errorMessage: string, errorCode?: string): MockWebSocketMessage {
    return {
      type: 'error',
      error: errorMessage,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
    };
  },
};

// ==================== Global Mock Setup ====================

let mockWebSocketInstance: MockWebSocket | null = null;
let mockServer: MockWebSocketServer = new MockWebSocketServer();

export function setupMockWebSocket(): void {
  // Store reference to real WebSocket if needed
  const RealWebSocket = globalThis.WebSocket;

  // Mock WebSocket constructor
  (globalThis as any).WebSocket = class extends MockWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);
      mockWebSocketInstance = this;
      
      // Extract session ID from URL and register with mock server
      const match = url.match(/\/websocket\/([^/]+)\/ws/);
      if (match) {
        mockServer.registerClient(match[1], this);
      }
    }
  };

  // Add static properties
  (globalThis as any).WebSocket.CONNECTING = MockWebSocket.CONNECTING;
  (globalThis as any).WebSocket.OPEN = MockWebSocket.OPEN;
  (globalThis as any).WebSocket.CLOSING = MockWebSocket.CLOSING;
  (globalThis as any).WebSocket.CLOSED = MockWebSocket.CLOSED;
}

export function getMockWebSocket(): MockWebSocket | null {
  return mockWebSocketInstance;
}

export function getMockServer(): MockWebSocketServer {
  return mockServer;
}

export function resetMockWebSocket(): void {
  mockWebSocketInstance = null;
  mockServer.clear();
}

export function teardownMockWebSocket(): void {
  resetMockWebSocket();
}
