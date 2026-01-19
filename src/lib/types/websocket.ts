// ==================== WebSocket Message Types ====================

export type WebSocketMessageType =
  // Client → Server
  | 'heartbeat'
  
  // Server → Client (All users)
  | 'connected'
  | 'pong'
  | 'session_status_changed'
  | 'waiting_room_opened'
  | 'session_started'
  | 'session_completed'
  | 'participant_joined'
  | 'participant_disconnected'
  
  // Server → Client (Teachers only)
  | 'student_progress'
  | 'student_answer'
  | 'student_highlight'
  | 'violation'
  | 'student_submitted'
  | 'session_stats'
  
  // Error
  | 'error';

export type SessionStatus = 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ViolationType = 
  | 'TAB_SWITCH' 
  | 'COPY_ATTEMPT' 
  | 'PASTE_ATTEMPT' 
  | 'RIGHT_CLICK' 
  | 'DEV_TOOLS' 
  | 'FULL_SCREEN_EXIT';

// ==================== Server → Client Messages ====================

export interface ConnectedMessage {
  type: 'connected';
  session_id: string;
  timestamp: string;
}

export interface PongMessage {
  type: 'pong';
  timestamp: string;
}

export interface SessionStatusChangedMessage {
  type: 'session_status_changed';
  session_id: string;
  status: SessionStatus;
  timestamp: string;
}

export interface WaitingRoomOpenedMessage {
  type: 'waiting_room_opened';
  session_id: string;
  timestamp: string;
}

export interface SessionStartedMessage {
  type: 'session_started';
  session_id: string;
  started_at: string;
  connected_students: string[];
  timestamp: string;
}

export interface SessionCompletedMessage {
  type: 'session_completed';
  session_id: string;
  completed_at: string;
  timestamp: string;
}

export interface ParticipantJoinedMessage {
  type: 'participant_joined';
  session_id: string;
  student_id: string;
  student_name: string;
  connected_count: number;
  timestamp: string;
}

export interface ParticipantDisconnectedMessage {
  type: 'participant_disconnected';
  session_id: string;
  student_id: string;
  student_name: string;
  connected_count: number;
  timestamp: string;
}

// ==================== Teacher-Only Messages ====================

export interface StudentProgressMessage {
  type: 'student_progress';
  session_id: string;
  student_id: string;
  student_name: string;
  passage_index: number;
  question_index: number;
  question_number: number;
  timestamp: string;
}

export interface StudentAnswerMessage {
  type: 'student_answer';
  session_id: string;
  student_id: string;
  student_name: string;
  question_id: string;
  question_number: number;
  answered: boolean;
  is_update: boolean;
  timestamp: string;
}

export interface StudentHighlightMessage {
  type: 'student_highlight';
  session_id: string;
  student_id: string;
  student_name: string;
  passage_index: number;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  timestamp: string;
}

export interface ViolationMessage {
  type: 'violation';
  session_id: string;
  student_id: string;
  student_name: string;
  violation_type: ViolationType;
  timestamp: string;
  total_count: number;
}

export interface StudentSubmittedMessage {
  type: 'student_submitted';
  session_id: string;
  student_id: string;
  student_name: string;
  score: number | null;
  timestamp: string;
}

export interface SessionStatsMessage {
  type: 'session_stats';
  session_id: string;
  connected_students: number;
  disconnected_students: number;
  submitted_students: number;
  average_progress: number;
  total_violations: number;
  timestamp: string;
}

// ==================== Error Messages ====================

export interface ErrorMessage {
  type: 'error';
  error: string;
  error_code?: string;
  timestamp: string;
}

// ==================== Client → Server Messages ====================

export interface HeartbeatMessage {
  type: 'heartbeat';
  timestamp: string;
}

// ==================== Union Types ====================

export type WebSocketMessage =
  // Server → Client (All users)
  | ConnectedMessage
  | PongMessage
  | SessionStatusChangedMessage
  | WaitingRoomOpenedMessage
  | SessionStartedMessage
  | SessionCompletedMessage
  | ParticipantJoinedMessage
  | ParticipantDisconnectedMessage
  // Teacher-Only Messages
  | StudentProgressMessage
  | StudentAnswerMessage
  | StudentHighlightMessage
  | ViolationMessage
  | StudentSubmittedMessage
  | SessionStatsMessage
  // Error Messages
  | ErrorMessage
  // Client → Server
  | HeartbeatMessage;

// ==================== Type Guards ====================

export function isConnectedMessage(msg: WebSocketMessage): msg is ConnectedMessage {
  return msg.type === 'connected';
}

export function isSessionStartedMessage(msg: WebSocketMessage): msg is SessionStartedMessage {
  return msg.type === 'session_started';
}

export function isSessionCompletedMessage(msg: WebSocketMessage): msg is SessionCompletedMessage {
  return msg.type === 'session_completed';
}

export function isParticipantJoinedMessage(msg: WebSocketMessage): msg is ParticipantJoinedMessage {
  return msg.type === 'participant_joined';
}

export function isParticipantDisconnectedMessage(msg: WebSocketMessage): msg is ParticipantDisconnectedMessage {
  return msg.type === 'participant_disconnected';
}

export function isStudentProgressMessage(msg: WebSocketMessage): msg is StudentProgressMessage {
  return msg.type === 'student_progress';
}

export function isStudentAnswerMessage(msg: WebSocketMessage): msg is StudentAnswerMessage {
  return msg.type === 'student_answer';
}

export function isViolationMessage(msg: WebSocketMessage): msg is ViolationMessage {
  return msg.type === 'violation';
}

export function isErrorMessage(msg: WebSocketMessage): msg is ErrorMessage {
  return msg.type === 'error';
}
