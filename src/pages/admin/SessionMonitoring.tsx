import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useSessionWebSocket } from '@/hooks/useSessionWebSocket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  Activity,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { SessionStats as SessionStatsAPI, ParticipantStats } from '@/lib/api/sessions';
import type { WebSocketMessage } from '@/lib/types/websocket';
import { sessionWebSocketService } from '@/lib/services/websocket';
import { StudentActivityFeed } from '@/components/admin/StudentActivityFeed';
import { StudentProgressCard, type StudentProgress } from '@/components/admin/StudentProgressCard';
import { SessionStatsDashboard, type SessionStats } from '@/components/admin/SessionStatsDashboard';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { useOptimizedWebSocket, useBatchedUpdates } from '@/hooks/useOptimizedWebSocket';
import type {
  StudentProgressMessage,
  StudentAnswerMessage,
  ViolationMessage,
  StudentSubmittedMessage,
  StudentHighlightMessage,
  ParticipantJoinedMessage,
  ParticipantDisconnectedMessage,
  SessionStatsMessage,
} from '@/lib/types/websocket';

const formatTime = (seconds: number | null): string => {
  if (seconds === null || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const SessionMonitoring: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, logout, getAccessToken } = useAuthStore();
  const {
    currentSession,
    sessionStats: apiStats,
    loading,
    error,
    fetchSessionById,
    fetchSessionStats,
    completeSession,
  } = useSessionStore();

  // Activity feed ref
  const activityFeedRef = useRef<any>(null);

  // Local state for real-time stats
  const [students, setStudents] = useBatchedUpdates<Map<string, StudentProgress>>(
    new Map(),
    300
  );
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Track violations by type
  const [violationsByType, setViolationsByType] = useState<Record<string, number>>({});

  // Optimized WebSocket message handling
  const { handleMessage: handleOptimizedMessage, messageCount } = useOptimizedWebSocket({
    onMessageBatch: handleMessageBatch,
    bufferInterval: 300,
    maxBufferSize: 30,
    enablePriorityQueue: true,
    enableDeduplication: true,
  });

  // Initial data fetch
  useEffect(() => {
    if (sessionId) {
      fetchSessionById(sessionId);
      fetchSessionStats(sessionId);
      // Poll stats every 10 seconds as fallback
      const interval = setInterval(() => {
        fetchSessionStats(sessionId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [sessionId, fetchSessionById, fetchSessionStats]);

  // Convert API stats to local format
  useEffect(() => {
    if (apiStats) {
      // Update students map
      const studentsMap = new Map<string, StudentProgress>();
      apiStats.participants.forEach((p) => {
        studentsMap.set(p.student_id, {
          student_id: p.student_id,
          student_name: p.student_name,
          connection_status: p.connection_status,
          current_passage: p.progress?.passage_index,
          current_question: p.progress?.question_index,
          total_questions: 40, // Adjust based on your test
          answers_submitted: p.answers_submitted,
          violations: p.tab_violations,
          last_activity: p.last_activity,
          is_submitted: false,
        });
      });
      setStudents(() => studentsMap);

      // Update session stats
      setSessionStats({
        total_students: apiStats.total_students,
        connected_students: apiStats.connected_students,
        disconnected_students: apiStats.total_students - apiStats.connected_students,
        submitted_students: 0,
        not_submitted_students: apiStats.total_students,
        total_answers: apiStats.total_answers_submitted,
        total_violations: apiStats.participants.reduce((sum, p) => sum + p.tab_violations, 0),
        violations_by_type: violationsByType,
        average_progress: 0,
        time_remaining: apiStats.time_remaining,
      });
    }
  }, [apiStats, violationsByType, setStudents]);

  // WebSocket connection
  const { status: wsStatus, isConnected, reconnectAttempts } = useSessionWebSocket({
    sessionId: sessionId || null,
    token: getAccessToken() || undefined,
    enabled: !!sessionId,
    autoConnect: true,
    onMessage: handleOptimizedMessage,
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: () => {
      console.log('WebSocket closed');
    },
  });

  // Update latency periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const newLatency = sessionWebSocketService.getLatency();
        setLatency(newLatency);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Handle batched WebSocket messages
  function handleMessageBatch(messages: WebSocketMessage[]) {
    messages.forEach((message) => {
      // Pass to activity feed
      if (activityFeedRef.current?.handleWebSocketMessage) {
        activityFeedRef.current.handleWebSocketMessage(message);
      }

      // Handle specific message types
      switch (message.type) {
        case 'student_progress':
          handleStudentProgress(message as StudentProgressMessage);
          break;
        case 'student_answer':
          handleStudentAnswer(message as StudentAnswerMessage);
          break;
        case 'student_highlight':
          handleStudentHighlight(message as StudentHighlightMessage);
          break;
        case 'violation':
          handleViolation(message as ViolationMessage);
          break;
        case 'student_submitted':
          handleStudentSubmitted(message as StudentSubmittedMessage);
          break;
        case 'participant_joined':
          handleParticipantJoined(message as ParticipantJoinedMessage);
          break;
        case 'participant_disconnected':
          handleParticipantDisconnected(message as ParticipantDisconnectedMessage);
          break;
        case 'session_stats':
          handleSessionStats(message as SessionStatsMessage);
          break;
        case 'session_completed':
          if (sessionId) {
            fetchSessionById(sessionId);
          }
          break;
      }
    });
  }

  // Message handlers
  const handleStudentProgress = useCallback((msg: StudentProgressMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          student_name: msg.student_name, // Update name from message
          current_passage: msg.passage_index + 1,
          current_question: msg.question_number,
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });
  }, [setStudents]);

  const handleStudentAnswer = useCallback((msg: StudentAnswerMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          student_name: msg.student_name, // Update name from message
          answers_submitted: msg.answered ? student.answers_submitted + (msg.is_update ? 0 : 1) : student.answers_submitted,
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });
  }, [setStudents]);

  const handleStudentHighlight = useCallback((msg: StudentHighlightMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          student_name: msg.student_name, // Update name from message
          highlights_count: (student.highlights_count || 0) + 1,
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });
  }, [setStudents]);

  const handleViolation = useCallback((msg: ViolationMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          violations: msg.total_count,
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });

    // Update violations by type
    setViolationsByType((prev) => ({
      ...prev,
      [msg.violation_type]: (prev[msg.violation_type] || 0) + 1,
    }));
  }, [setStudents]);

  const handleStudentSubmitted = useCallback((msg: StudentSubmittedMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          student_name: msg.student_name, // Update name from message
          is_submitted: true,
          score: msg.score,
          time_taken_seconds: msg.time_taken_seconds,
          answers_submitted: msg.answered_questions,
          total_questions: msg.total_questions,
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });

    // Update session stats
    setSessionStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        submitted_students: prev.submitted_students + 1,
        not_submitted_students: prev.not_submitted_students - 1,
      };
    });
  }, [setStudents]);

  const handleParticipantJoined = useCallback((msg: ParticipantJoinedMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(msg.student_id)) {
        // Student not in our map yet - create with placeholder name
        // The name will be populated from other messages (student_progress, student_answer, etc.)
        // or from the next API stats fetch
        newMap.set(msg.student_id, {
          student_id: msg.student_id,
          student_name: 'Loading...', // Placeholder until we get name from other messages
          connection_status: 'CONNECTED',
          total_questions: 40,
          answers_submitted: 0,
          violations: 0,
          last_activity: msg.timestamp,
        });
      } else {
        const student = newMap.get(msg.student_id)!;
        newMap.set(msg.student_id, {
          ...student,
          connection_status: 'CONNECTED',
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });

    // Update session stats
    setSessionStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        connected_students: msg.connected_count,
        disconnected_students: prev.total_students - msg.connected_count,
      };
    });
  }, [setStudents]);

  const handleParticipantDisconnected = useCallback((msg: ParticipantDisconnectedMessage) => {
    setStudents((prev) => {
      const newMap = new Map(prev);
      const student = newMap.get(msg.student_id);
      if (student) {
        newMap.set(msg.student_id, {
          ...student,
          connection_status: 'DISCONNECTED',
          last_activity: msg.timestamp,
        });
      }
      return newMap;
    });

    // Update session stats
    setSessionStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        connected_students: msg.connected_count,
        disconnected_students: prev.total_students - msg.connected_count,
      };
    });
  }, [setStudents]);

  const handleSessionStats = useCallback((msg: SessionStatsMessage) => {
    setSessionStats((prev) => ({
      ...prev!,
      total_students: msg.stats.total_participants,
      connected_students: msg.stats.connected_count,
      disconnected_students: msg.stats.total_participants - msg.stats.connected_count,
      submitted_students: msg.stats.submitted_count,
      not_submitted_students: msg.stats.total_participants - msg.stats.submitted_count,
      average_progress: msg.stats.average_progress,
      total_violations: msg.stats.total_violations,
    }));
  }, []);

  // Complete session handler
  const handleCompleteSession = async () => {
    if (!sessionId || !confirm('Are you sure you want to complete this session?')) return;
    try {
      await completeSession(sessionId);
      if (sessionId) {
        fetchSessionById(sessionId);
      }
    } catch (err) {
      // Error is handled by store
    }
  };

  // Reconnect handler
  const handleReconnect = useCallback(() => {
    if (sessionId) {
      sessionWebSocketService.connect(sessionId, getAccessToken() || undefined);
    }
  }, [sessionId, getAccessToken]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">Invalid session ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentsArray = Array.from(students.values());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IE</span>
                </div>
                <span className="font-semibold text-white">IELTS Practice</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <Badge className={
                user?.role === 'TEACHER'
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }>
                <Shield className="h-3 w-3 mr-1" />
                {user?.role === 'TEACHER' ? 'Teacher' : 'Admin'}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* WebSocket Status with Details */}
              <ConnectionStatus
                status={wsStatus}
                reconnectAttempts={reconnectAttempts()}
                maxReconnectAttempts={sessionWebSocketService.getMaxReconnectAttempts()}
                onReconnect={handleReconnect}
                latency={latency || undefined}
              />
              
              {/* Message counter */}
              {messageCount > 0 && (
                <Badge variant="outline" className="bg-slate-800 text-slate-300">
                  <Activity className="h-3 w-3 mr-1" />
                  {messageCount} messages
                </Badge>
              )}

              {user && (
                <span className="text-sm text-slate-400">
                  Welcome, <span className="text-white">{user.full_name}</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/sessions')}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentSession?.title || 'Session Monitoring'}
            </h1>
            <p className="text-slate-400">
              Real-time monitoring of student activities
              {currentSession && (
                <>
                  {' • '}
                  {new Date(currentSession.scheduled_at).toLocaleString()}
                </>
              )}
            </p>
          </div>
          {currentSession?.status === 'IN_PROGRESS' && (
            <Button
              onClick={handleCompleteSession}
              className="bg-orange-600 hover:bg-orange-500"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Session
            </Button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Dashboard */}
        {sessionStats && <SessionStatsDashboard stats={sessionStats} />}

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-slate-900/50 border-slate-800">
            <TabsTrigger value="students" className="data-[state=active]:bg-indigo-600">
              <Users className="h-4 w-4 mr-2" />
              Students ({studentsArray.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-indigo-600">
              <Activity className="h-4 w-4 mr-2" />
              Activity Feed
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {loading && studentsArray.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="text-slate-400">Loading session data...</span>
                  </div>
                </CardContent>
              </Card>
            ) : studentsArray.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <p className="text-center text-slate-500">No participants yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentsArray.map((student) => (
                  <StudentProgressCard key={student.student_id} student={student} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity">
            <StudentActivityFeed ref={activityFeedRef} maxEvents={100} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
