import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useClassStore } from '@/lib/stores/classStore';
import { useSessionWebSocket } from '@/hooks/useSessionWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Users,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { WebSocketMessage } from '@/lib/types/websocket';

export const SessionWaitingRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, logout, getAccessToken } = useAuthStore();
  const {
    currentSession,
    loading,
    error,
    fetchSessionById,
  } = useSessionStore();
  const { classes, fetchClasses } = useClassStore();

  const [connectedCount, setConnectedCount] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>('');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date());

  useEffect(() => {
    if (sessionId) {
      fetchSessionById(sessionId);
    }
    fetchClasses();
  }, [sessionId, fetchSessionById, fetchClasses]);

  // Monitor connection quality based on message timing
  useEffect(() => {
    const checkConnectionQuality = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTime.getTime();
      if (timeSinceLastMessage > 60000) {
        setConnectionQuality('poor');
      } else if (timeSinceLastMessage > 30000) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('good');
      }
    }, 5000);

    return () => clearInterval(checkConnectionQuality);
  }, [lastMessageTime]);

  // WebSocket connection
  const { status: wsStatus, isConnected, connect, disconnect } = useSessionWebSocket({
    sessionId: sessionId || null,
    token: getAccessToken() || undefined,
    enabled: !!sessionId,
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    // Update last message time for connection quality monitoring
    setLastMessageTime(new Date());

    switch (message.type) {
      case 'connected':
        console.log('Connected to waiting room');
        setConnectionQuality('good');
        break;

      case 'pong':
        // Heartbeat response - connection is alive
        setConnectionQuality('good');
        break;

      case 'session_status_changed':
        if ('status' in message) {
          setSessionStatus(message.status);
          console.log('Session status changed:', message.status);
          
          // If session was cancelled, show message and redirect
          if (message.status === 'CANCELLED') {
            alert('This session has been cancelled by the teacher.');
            navigate('/student/sessions');
          }
        }
        break;

      case 'waiting_room_opened':
        console.log('Waiting room opened');
        setSessionStatus('WAITING');
        // Refresh session data to get updated participant list
        if (sessionId) {
          fetchSessionById(sessionId);
        }
        break;

      case 'participant_joined':
        if ('connected_count' in message) {
          setConnectedCount(message.connected_count);
          console.log('Student joined:', message.student_name, '- Total connected:', message.connected_count);
        }
        break;

      case 'participant_disconnected':
        if ('connected_count' in message) {
          setConnectedCount(message.connected_count);
          console.log('Student disconnected:', message.student_name, '- Total connected:', message.connected_count);
        }
        break;

      case 'session_started':
        console.log('Session started, redirecting to test...');
        // Redirect to test interface
        if (sessionId) {
          navigate(`/student/sessions/${sessionId}/test`);
        }
        break;

      case 'session_completed':
        console.log('Session completed');
        // Redirect to results page
        if (sessionId) {
          navigate(`/student/sessions/${sessionId}/results`);
        }
        break;

      case 'error':
        if ('error' in message) {
          console.error('WebSocket error:', message.error);
          alert(`Error: ${message.error}`);
        }
        break;

      default:
        // Log unhandled message types for debugging
        console.log('Unhandled WebSocket message:', message.type);
        break;
    }
  };

  useEffect(() => {
    if (currentSession) {
      const connected = currentSession.participants.filter(
        (p) => p.connection_status === 'CONNECTED'
      ).length;
      setConnectedCount(connected);
    }
  }, [currentSession]);

  // Sync session status from server
  useEffect(() => {
    if (currentSession) {
      setSessionStatus(currentSession.status);
      
      // Auto-redirect if session is already started
      if (currentSession.status === 'IN_PROGRESS' && sessionId) {
        navigate(`/student/sessions/${sessionId}/test`);
      }
    }
  }, [currentSession, sessionId, navigate]);

  const getClassName = (classId: string): string => {
    const class_ = classes.find((c) => c.id === classId);
    return class_?.name || 'Unknown Class';
  };

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
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                <GraduationCap className="h-3 w-3 mr-1" />
                Student
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* WebSocket Status */}
              <Badge
                className={
                  isConnected
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Connecting...
                  </>
                )}
              </Badge>
              {user && (
                <span className="text-sm text-slate-400">
                  {user.full_name}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/student/sessions')}
                className="text-slate-400 hover:text-white"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-slate-400">Loading session...</span>
                </div>
              </CardContent>
            </Card>
          ) : !currentSession ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12">
                <p className="text-center text-slate-500">Session not found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl mb-2">
                  {currentSession.title}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {getClassName(currentSession.class_id)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Waiting Message */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30">
                    <Clock className="h-8 w-8 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Waiting for Teacher to Start
                    </h3>
                    <p className="text-slate-400">
                      Please wait while the teacher prepares the session. You will be automatically
                      redirected when the test begins.
                    </p>
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Session Status:</span>
                    <Badge
                      className={
                        sessionStatus === 'IN_PROGRESS'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : sessionStatus === 'WAITING'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }
                    >
                      {sessionStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Scheduled Time:</span>
                    <span className="text-white">
                      {new Date(currentSession.scheduled_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Connected Students:</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-400" />
                      <span className="text-white font-semibold">{connectedCount}</span>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                {!isConnected && (
                  <Alert className="bg-yellow-950/50 border-yellow-500/50">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-400">
                      Connecting to session... Please wait.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Connection Quality Indicator */}
                {isConnected && connectionQuality !== 'good' && (
                  <Alert className={
                    connectionQuality === 'poor' 
                      ? 'bg-red-950/50 border-red-500/50' 
                      : 'bg-yellow-950/50 border-yellow-500/50'
                  }>
                    <AlertCircle className={`h-4 w-4 ${
                      connectionQuality === 'poor' ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                    <AlertDescription className={
                      connectionQuality === 'poor' ? 'text-red-400' : 'text-yellow-400'
                    }>
                      {connectionQuality === 'poor' 
                        ? 'Connection quality is poor. Please check your internet connection.' 
                        : 'Connection quality is fair. Some delays may occur.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

