import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useSessionAttemptStore } from '@/lib/stores/sessionAttemptStore';
import { useSessionWebSocket } from '@/hooks/useSessionWebSocket';
import { useViolationDetection } from '@/hooks/useViolationDetection';
import { useTextHighlight } from '@/hooks/useTextHighlight';
import { useStudentActivities } from '@/hooks/useStudentActivities';
import { attemptsApi } from '@/lib/api/attempts';
import { testsApi, type GetTestDetailWithViewResponse } from '@/lib/api/tests';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QuestionRenderer } from '@/components/student/QuestionRenderer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wifi,
  WifiOff,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { WebSocketMessage } from '@/lib/types/websocket';
import type { Question } from '@/lib/types/question';
import type { Passage } from '@/lib/types/passage';

// Helper to convert API test data to internal Test format
const convertTestData = (data: GetTestDetailWithViewResponse): {
  passages: Passage[];
  totalQuestions: number;
  timeLimit: number;
} => {
  const passages: Passage[] = data.passages.map((p, passageIndex) => {
    const questionGroups = p.question_groups.map((g) => {
      const questions: Question[] = (g.questions || []).map((q, qIndex) => {
        // Generate question ID
        const questionId = `q-${passageIndex}-${g.id}-${q.question_number}`;
        
        // Convert question based on type
        const baseQuestion = {
          id: questionId,
          type: q.question_type as Question['type'],
          questionNumber: q.question_number,
          text: q.question_text,
        };

        // Add type-specific fields
        if (q.question_type === 'MULTIPLE_CHOICE' && q.options) {
          return {
            ...baseQuestion,
            type: 'MULTIPLE_CHOICE' as const,
            options: q.options.map((opt) => opt.text),
            answer: '',
          } as Question;
        }

        // Add other question types as needed
        return {
          ...baseQuestion,
          answer: '',
        } as Question;
      });

      return {
        id: g.id,
        type: g.question_type as Question['type'],
        startNumber: g.start_question_number,
        endNumber: g.end_question_number,
        instructions: g.group_instructions,
        questions,
      };
    });

    return {
      id: `passage-${passageIndex}`,
      title: p.title,
      content: p.content,
      questionGroups,
      totalQuestions: p.question_groups.reduce(
        (sum, g) => sum + (g.questions?.length || 0),
        0
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const totalQuestions = passages.reduce(
    (sum, p) => sum + p.totalQuestions,
    0
  );

  return {
    passages,
    totalQuestions,
    timeLimit: data.test_metadata.estimated_time_minutes || 60,
  };
};

const formatTime = (seconds: number | null): string => {
  if (seconds === null || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const SessionTestInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuthStore();
  const {
    currentSession,
    loading: sessionLoading,
    fetchSessionById,
  } = useSessionStore();
  const {
    attemptId,
    sessionId: storeSessionId,
    testData,
    answers,
    progress,
    timeRemaining,
    tabViolations,
    connectionStatus,
    initializeAttempt,
    setAnswer,
    updateProgress,
    recordTabViolation,
    setTimeRemaining,
    setConnectionStatus,
    syncState,
  } = useSessionAttemptStore();

  const [testDataState, setTestDataState] = useState<GetTestDetailWithViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WebSocket connection
  const { status: wsStatus, isConnected } = useSessionWebSocket({
    sessionId: sessionId || null,
    token: getAccessToken() || undefined,
    enabled: !!sessionId && !!attemptId,
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    },
    onClose: () => {
      setConnectionStatus('disconnected');
    },
  });

  useEffect(() => {
    setConnectionStatus(wsStatus);
  }, [wsStatus, setConnectionStatus]);

  // Student activities tracking
  const { sendProgress, sendHighlight, sendViolation, sendAnswer } = useStudentActivities({
    sessionId: sessionId || '',
    attemptId: attemptId || undefined,
    enabled: !!sessionId && !!attemptId,
    progressDebounceMs: 2000,
    highlightDebounceMs: 2000,
  });

  // Text highlighting
  const { highlights, handleSelection } = useTextHighlight({
    passageIndex: currentPassageIndex,
    enabled: !!attemptId,
    debounceMs: 2000,
    onHighlight: (highlight) => {
      // Send highlight via WebSocket
      sendHighlight({
        passageIndex: highlight.passageIndex,
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        text: highlight.text,
      });
    },
  });

  // Comprehensive violation detection
  useViolationDetection({
    enabled: !!attemptId,
    enableBlocking: false,
    onViolation: (violation) => {
      // Send violation via activities hook
      sendViolation(violation.type);
      
      // Also record via REST API for persistence
      if (attemptId) {
        attemptsApi.recordTabViolation(attemptId).catch(console.error);
      }

      // Update local state
      if (violation.type === 'TAB_SWITCH') {
        recordTabViolation();
      }
    },
    onWarning: (message) => {
      setWarningMessage(message);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    },
  });

  // Load session and test data
  useEffect(() => {
    const loadData = async () => {
      if (!sessionId) {
        setError('Invalid session ID');
        setLoading(false);
        return;
      }

      try {
        // Load session
        await fetchSessionById(sessionId);

        // Wait for session to load
        if (!currentSession) {
          // Will be set by fetchSessionById
          return;
        }

        // Load test data
        const testData = await testsApi.getTestDetailWithView(
          currentSession.test_id,
          'USER'
        );
        setTestDataState(testData);

        // Convert and initialize attempt
        const converted = convertTestData(testData);
        const testDataForStore = {
          id: currentSession.test_id,
          title: testData.test_metadata.title || 'Test',
          type: testData.test_metadata.type,
          description: testData.test_metadata.description || undefined,
          passages: converted.passages,
          totalQuestions: converted.totalQuestions,
          timeLimit: converted.timeLimit,
          createdAt: new Date(testData.test_metadata.created_at),
          updatedAt: new Date(testData.test_metadata.updated_at || testData.test_metadata.created_at),
          isPublished: testData.test_metadata.status === 'PUBLISHED',
        };

        // Find participant's attempt ID
        const participant = currentSession.participants.find(
          (p) => p.student_id === user?.user_id
        );

        if (participant?.attempt_id) {
          // Load existing attempt
          const attempt = await attemptsApi.getAttemptById(participant.attempt_id);
          initializeAttempt(attempt.id, sessionId, testDataForStore);
          syncState(attempt);
        } else {
          // New attempt - will be created when session starts
          initializeAttempt('', sessionId, testDataForStore);
        }
      } catch (err) {
        console.error('Failed to load session data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId, fetchSessionById, currentSession, user, initializeAttempt, syncState]);

  // Handle auto-submit when session completes
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await attemptsApi.submitAttempt(attemptId);
      console.log('Attempt auto-submitted successfully');
      
      // Redirect to results after short delay
      setTimeout(() => {
        if (sessionId) {
          navigate(`/student/sessions/${sessionId}/results`);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to auto-submit attempt:', error);
      // Still redirect even if submission fails
      if (sessionId) {
        navigate(`/student/sessions/${sessionId}/results`);
      }
    }
  }, [attemptId, sessionId, navigate, isSubmitting]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'connected':
          setConnectionStatus('connected');
          break;

        case 'session_started':
          // Session started - attempt should be created by server
          if (sessionId && currentSession) {
            fetchSessionById(sessionId);
          }
          break;

        case 'session_completed':
          // Auto-submit and redirect to results
          console.log('Session completed - auto-submitting attempt');
          handleAutoSubmit();
          break;

        case 'pong':
          // Heartbeat response
          break;

        case 'error':
          if ('error' in message) {
            console.error('WebSocket error message:', message.error);
            setWarningMessage(`Error: ${message.error}`);
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 5000);
          }
          break;

        default:
          // Log unhandled messages
          console.log('Unhandled WebSocket message:', message.type);
          break;
      }
    },
    [
      sessionId,
      currentSession,
      fetchSessionById,
      handleAutoSubmit,
      setConnectionStatus,
    ]
  );

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionId: string, answer: string | string[]) => {
      setAnswer(questionId, answer);

      // Save via REST API
      if (attemptId) {
        attemptsApi.submitAnswer(attemptId, questionId, answer).catch(console.error);
      }

      // Find question number and send answer notification
      if (testData) {
        const allQuestions: Question[] = [];
        testData.passages.forEach((p) => {
          p.questionGroups.forEach((g) => {
            allQuestions.push(...g.questions);
          });
        });

        const question = allQuestions.find((q) => q.id === questionId);
        if (question) {
          // Send answer notification via activities hook
          sendAnswer(
            questionId,
            question.questionNumber,
            !!(answer && (Array.isArray(answer) ? answer.length > 0 : answer.trim() !== ''))
          );
        }
      }
    },
    [attemptId, testData, setAnswer, sendAnswer]
  );

  // Track question navigation for progress updates
  useEffect(() => {
    if (!testData || !attemptId) return;

    // Calculate the absolute question number being viewed
    const allQuestions: Question[] = [];
    testData.passages.forEach((p) => {
      p.questionGroups.forEach((g) => {
        allQuestions.push(...g.questions);
      });
    });

    const currentPassage = testData.passages[currentPassageIndex];
    if (!currentPassage) return;

    const passageQuestions = currentPassage.questionGroups.flatMap((g) => g.questions);
    const currentQuestion = passageQuestions[currentQuestionIndex];
    
    if (currentQuestion) {
      // Update progress in store
      updateProgress(currentPassageIndex, currentQuestionIndex);

      // Send progress update via activities hook (with debouncing)
      sendProgress({
        passageIndex: currentPassageIndex,
        questionIndex: currentQuestionIndex,
        questionNumber: currentQuestion.questionNumber,
      });

      // Also save via REST API
      attemptsApi
        .updateProgress(attemptId, currentPassageIndex, currentQuestionIndex)
        .catch(console.error);
    }
  }, [currentPassageIndex, currentQuestionIndex, attemptId, testData, updateProgress, sendProgress]);

  // Timer effect - sync from server periodically
  useEffect(() => {
    if (!attemptId || !currentSession?.started_at) return;

    const updateTimer = async () => {
      try {
        const attempt = await attemptsApi.getAttemptById(attemptId);
        if (attempt.time_remaining !== null) {
          setTimeRemaining(attempt.time_remaining);
        }

        // Check if time is up
        if (attempt.time_remaining !== null && attempt.time_remaining <= 0) {
          // Time's up - attempt should be auto-submitted by server
          if (sessionId) {
            navigate(`/student/sessions/${sessionId}/results`);
          }
        }
      } catch (err) {
        console.error('Failed to update timer:', err);
      }
    };

    // Update immediately
    updateTimer();

    // Update every 10 seconds
    const interval = setInterval(updateTimer, 10000);

    return () => clearInterval(interval);
  }, [attemptId, currentSession, sessionId, navigate, setTimeRemaining]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <span className="text-slate-400">Loading session...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !testData || !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">
              {error || 'Session or test data not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPassage = testData.passages[currentPassageIndex];
  const allQuestions = currentPassage.questionGroups.flatMap((g) => g.questions);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{currentSession.title}</h1>
          <p className="text-sm text-slate-400">
            Passage {currentPassageIndex + 1} of {testData.passages.length}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {/* Connection Status */}
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
                Disconnected
              </>
            )}
          </Badge>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-lg font-mono text-white">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Tab Violations */}
          {tabViolations > 0 && (
            <Badge variant="destructive">
              {tabViolations} violation{tabViolations > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Warning */}
      {showWarning && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Passage Panel */}
        <div 
          className="w-1/2 border-r border-slate-800 overflow-y-auto p-6 bg-slate-900/30"
          onMouseUp={handleSelection}
        >
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-white">{currentPassage.title}</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 select-text">
              {currentPassage.content}
            </div>
          </div>
          
          {/* Show highlight count */}
          {highlights.length > 0 && (
            <div className="mt-4 text-xs text-slate-500">
              {highlights.length} highlight{highlights.length !== 1 ? 's' : ''} captured
            </div>
          )}
        </div>

        {/* Questions Panel */}
        <div className="w-1/2 overflow-y-auto p-6 bg-slate-900/50">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10">
              Questions{' '}
              {currentPassage.questionGroups[0]?.startNumber} -{' '}
              {currentPassage.questionGroups[0]?.endNumber}
            </h3>

            {allQuestions.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                answer={answers.get(question.id)}
                onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4 flex items-center justify-between bg-slate-900/50">
        <Button
          variant="outline"
          onClick={() => setCurrentPassageIndex(currentPassageIndex - 1)}
          disabled={currentPassageIndex === 0}
          className="border-slate-700"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Passage
        </Button>

        {currentPassageIndex === testData.passages.length - 1 ? (
          <div className="text-sm text-slate-400">
            Last passage - answers are saved automatically
          </div>
        ) : (
          <Button
            onClick={() => setCurrentPassageIndex(currentPassageIndex + 1)}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Next Passage
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

