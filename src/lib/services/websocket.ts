import { useAuthStore } from '../stores/authStore';
import type { 
  WebSocketMessage, 
  WebSocketMessageType,
  ViolationType 
} from '../types/websocket';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Determine WebSocket protocol
const getWebSocketProtocol = (): string => {
  const protocol = window.location.protocol;
  return protocol === 'https:' ? 'wss:' : 'ws:';
};

const getWebSocketBaseUrl = (): string => {
  const wsProtocol = getWebSocketProtocol();
  const baseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol);
  return baseUrl;
};

// ==================== Types ====================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Re-export types from websocket types file
export type { WebSocketMessage, WebSocketMessageType, ViolationType };

export type MessageHandler = (message: WebSocketMessage) => void;
export type ErrorHandler = (error: Event | Error) => void;
export type CloseHandler = (event: CloseEvent) => void;

// ==================== WebSocket Service ====================

export class SessionWebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private token: string | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private lastPingTime: number | null = null;
  private latency: number | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private shouldReconnect = true;
  private closeCode: number | null = null;
  private closeReason: string | null = null;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection latency in milliseconds
   */
  getLatency(): number | null {
    return this.latency;
  }

  /**
   * Get last close code
   */
  getCloseCode(): number | null {
    return this.closeCode;
  }

  /**
   * Get last close reason
   */
  getCloseReason(): string | null {
    return this.closeReason;
  }

  /**
   * Get reconnection attempts count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Get max reconnection attempts
   */
  getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }

  /**
   * Connect to a session
   */
  async connect(sessionId: string, token?: string): Promise<void> {
    if (this.isConnected() && this.sessionId === sessionId) {
      console.log('Already connected to this session');
      return;
    }

    // Disconnect existing connection if any
    if (this.ws) {
      this.shouldReconnect = false;
      this.disconnect();
    }

    this.sessionId = sessionId;
    this.token = token || useAuthStore.getState().getAccessToken() || '';
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;

    await this._connect();
  }

  /**
   * Internal connect method
   */
  private async _connect(): Promise<void> {
    if (!this.sessionId || !this.token) {
      throw new Error('Session ID and token are required');
    }

    this.status = 'connecting';

    try {
      const wsBaseUrl = getWebSocketBaseUrl();
      const wsUrl = `${wsBaseUrl}/api/v1/websocket/${this.sessionId}/ws?token=${encodeURIComponent(this.token)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this._startHeartbeat();
        this._notifyMessageHandlers({
          type: 'connected',
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._notifyErrorHandlers(error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.status = 'disconnected';
        this.closeCode = event.code;
        this.closeReason = event.reason;
        this._stopHeartbeat();
        this._stopPingTimeout();
        this._notifyCloseHandlers(event);

        // Handle specific close codes
        const errorMessage = this._getCloseCodeMessage(event.code);
        if (errorMessage) {
          console.warn('WebSocket close reason:', errorMessage);
          this._notifyErrorHandlers(new Error(errorMessage));
        }

        // Determine if we should attempt reconnection based on close code
        const shouldAttemptReconnect = this._shouldReconnectOnClose(event.code);
        
        if (this.shouldReconnect && shouldAttemptReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this._scheduleReconnect();
        } else if (!shouldAttemptReconnect) {
          console.log('Not attempting reconnection due to close code:', event.code);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.status = 'disconnected';
      this._notifyErrorHandlers(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from session
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this._stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.status = 'disconnected';
    this.sessionId = null;
    this.token = null;
  }

  /**
   * Send a message to the server
   */
  sendMessage(type: WebSocketMessageType, data?: any): void {
    if (!this.isConnected() || !this.ws) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const message = {
      type,
      ...(data && { ...data }),
      timestamp: new Date().toISOString(),
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this._notifyErrorHandlers(error as Error);
    }
  }

  /**
   * Send a heartbeat message
   */
  sendHeartbeat(): void {
    this.sendMessage('heartbeat');
  }

  /**
   * Send a violation message
   */
  sendViolation(violationType: ViolationType): void {
    this.sendMessage('violation', { violation_type: violationType });
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register a close handler
   */
  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  /**
   * Handle incoming message
   */
  private _handleMessage(message: WebSocketMessage): void {
    // Handle heartbeat response and calculate latency
    if (message.type === 'pong') {
      if (this.lastPingTime) {
        this.latency = Date.now() - this.lastPingTime;
        this.lastPingTime = null;
      }
      this._resetPingTimeout();
      return; // No need to notify handlers
    }

    this._notifyMessageHandlers(message);
  }

  /**
   * Notify all message handlers
   */
  private _notifyMessageHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Notify all error handlers
   */
  private _notifyErrorHandlers(error: Event | Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });
  }

  /**
   * Notify all close handlers
   */
  private _notifyCloseHandlers(event: CloseEvent): void {
    this.closeHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in close handler:', error);
      }
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.sendMessage('heartbeat');
        this._setPingTimeout();
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private _stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private _scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectAttempts++;
    this.status = 'reconnecting';

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && this.sessionId && this.token) {
        this._connect();
      }
    }, delay);
  }

  /**
   * Set ping timeout to detect connection loss
   */
  private _setPingTimeout(): void {
    this._stopPingTimeout();
    this.pingTimeout = setTimeout(() => {
      console.warn('Ping timeout - connection may be lost');
      // Force disconnect and reconnect
      if (this.ws) {
        this.ws.close(1000, 'Ping timeout');
      }
    }, 45000); // 45 seconds timeout (30s heartbeat + 15s grace period)
  }

  /**
   * Reset ping timeout
   */
  private _resetPingTimeout(): void {
    this._stopPingTimeout();
  }

  /**
   * Stop ping timeout
   */
  private _stopPingTimeout(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Get user-friendly error message for close code
   */
  private _getCloseCodeMessage(code: number): string | null {
    switch (code) {
      case 1000:
        return null; // Normal closure
      case 1001:
        return 'Server is going away';
      case 1002:
        return 'Protocol error';
      case 1003:
        return 'Unsupported data type';
      case 1006:
        return 'Connection closed abnormally';
      case 1007:
        return 'Invalid message data';
      case 1008:
        return 'Policy violation - please check your session access';
      case 1009:
        return 'Message too large';
      case 1010:
        return 'Server extension negotiation failed';
      case 1011:
        return 'Server encountered an unexpected condition';
      case 1012:
        return 'Service is restarting';
      case 1013:
        return 'Service is overloaded, please try again later';
      case 1014:
        return 'Bad gateway';
      case 1015:
        return 'TLS handshake failed';
      case 4000:
        return 'Invalid session or token';
      case 4001:
        return 'Session not found';
      case 4002:
        return 'Session has ended';
      case 4003:
        return 'Unauthorized access';
      case 4004:
        return 'Session is full';
      default:
        if (code >= 4000 && code < 5000) {
          return `Application error: ${code}`;
        }
        return `Connection closed with code ${code}`;
    }
  }

  /**
   * Determine if reconnection should be attempted based on close code
   */
  private _shouldReconnectOnClose(code: number): boolean {
    // Don't reconnect on these codes
    const noReconnectCodes = [
      1000, // Normal closure
      1001, // Going away
      1008, // Policy violation
      4000, // Invalid session or token
      4001, // Session not found
      4002, // Session has ended
      4003, // Unauthorized access
      4004, // Session is full
    ];
    
    return !noReconnectCodes.includes(code);
  }
}

// Export singleton instance (optional, can also create new instances)
export const sessionWebSocketService = new SessionWebSocketService();

