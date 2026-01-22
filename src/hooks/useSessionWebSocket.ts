import { useEffect, useRef, useState, useCallback } from 'react';
import {
  SessionWebSocketService,
  sessionWebSocketService,
  type ConnectionStatus,
  type WebSocketMessage,
  type WebSocketMessageType,
} from '../lib/services/websocket';

interface UseSessionWebSocketOptions {
  sessionId: string | null;
  token?: string;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event | Error) => void;
  onClose?: (event: CloseEvent) => void;
  autoConnect?: boolean;
}

interface UseSessionWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (type: WebSocketMessageType, data?: any) => void;
}

/**
 * React hook for managing WebSocket connection to a session
 */
export function useSessionWebSocket(
  options: UseSessionWebSocketOptions
): UseSessionWebSocketReturn {
  const {
    sessionId,
    token,
    enabled = true,
    onMessage,
    onError,
    onClose,
    autoConnect = true,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const serviceRef = useRef<SessionWebSocketService>(sessionWebSocketService);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  }, [onMessage, onError, onClose]);

  // Update status from service
  useEffect(() => {
    const service = serviceRef.current;
    const updateStatus = () => setStatus(service.getStatus());

    // Initial status
    updateStatus();

    // Poll status (could be improved with event emitter pattern)
    const interval = setInterval(updateStatus, 100);

    return () => clearInterval(interval);
  }, []);

  // Connect function
  const connect = useCallback(async () => {
    if (!sessionId || !enabled) {
      return;
    }

    try {
      await serviceRef.current.connect(sessionId, token);
      setStatus(serviceRef.current.getStatus());
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      if (onErrorRef.current) {
        onErrorRef.current(error as Error);
      }
    }
  }, [sessionId, token, enabled]);

  // Disconnect function
  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
    setStatus('disconnected');
  }, []);

  // Send message function
  const sendMessage = useCallback(
    (type: WebSocketMessageType, data?: any) => {
      serviceRef.current.sendMessage(type, data);
    },
    []
  );

  // Auto-connect on mount or when sessionId changes
  useEffect(() => {
    if (autoConnect && enabled && sessionId) {
      connect();
    }

    return () => {
      // Disconnect when component unmounts or sessionId changes
      console.log('useSessionWebSocket: Cleaning up, disconnecting WebSocket');
      serviceRef.current.disconnect();
      setStatus('disconnected');
    };
  }, [autoConnect, enabled, sessionId, connect]);

  // Register message handlers
  useEffect(() => {
    const service = serviceRef.current;

    const messageHandler = (message: WebSocketMessage) => {
      if (onMessageRef.current) {
        onMessageRef.current(message);
      }
    };

    const errorHandler = (error: Event | Error) => {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    };

    const closeHandler = (event: CloseEvent) => {
      setStatus('disconnected');
      if (onCloseRef.current) {
        onCloseRef.current(event);
      }
    };

    const unregisterMessage = service.onMessage(messageHandler);
    const unregisterError = service.onError(errorHandler);
    const unregisterClose = service.onClose(closeHandler);

    return () => {
      unregisterMessage();
      unregisterError();
      unregisterClose();
    };
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    sendMessage,
  };
}

