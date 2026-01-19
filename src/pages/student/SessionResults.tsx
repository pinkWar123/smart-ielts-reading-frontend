import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { attemptsApi } from '@/lib/api/attempts';
import { testsApi, type GetTestDetailWithViewResponse } from '@/lib/api/tests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  LogOut,
  Home,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { calculateScore } from '@/lib/utils/scoring';
import type { Attempt } from '@/lib/api/attempts';
import type { Question } from '@/lib/types/question';
import type { StudentAnswer } from '@/lib/types/test';

export const SessionResults: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentSession, fetchSessionById, loading: sessionLoading } = useSessionStore();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [testData, setTestData] = useState<GetTestDetailWithViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    bandScore?: number;
    answers: StudentAnswer[];
  } | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!sessionId) {
        setError('Invalid session ID');
        setLoading(false);
        return;
      }

      try {
        // Load session
        await fetchSessionById(sessionId);

        if (!currentSession) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        // Find participant's attempt
        const participant = currentSession.participants.find(
          (p) => p.student_id === user?.user_id
        );

        if (!participant?.attempt_id) {
          setError('Attempt not found');
          setLoading(false);
          return;
        }

        // Load attempt
        const attemptData = await attemptsApi.getAttemptById(participant.attempt_id);
        setAttempt(attemptData);

        // Load test data
        const testDataResponse = await testsApi.getTestDetailWithView(
          currentSession.test_id,
          'ADMIN' // Use ADMIN view to get correct answers for scoring
        );
        setTestData(testDataResponse);

        // Calculate results
        if (testDataResponse && attemptData) {
          // Convert answers to StudentAnswer format
          const studentAnswers: StudentAnswer[] = [];
          
          testDataResponse.passages.forEach((passage, passageIndex) => {
            passage.question_groups.forEach((group) => {
              (group.questions || []).forEach((q) => {
                const questionId = `q-${passageIndex}-${group.id}-${q.question_number}`;
                const answer = attemptData.answers[questionId];
                
                studentAnswers.push({
                  questionId,
                  questionNumber: q.question_number,
                  answer: answer || '',
                });
              });
            });
          });

          // Convert to Question format for scoring
          const allQuestions: Question[] = [];
          testDataResponse.passages.forEach((passage, passageIndex) => {
            passage.question_groups.forEach((group) => {
              (group.questions || []).forEach((q) => {
                const questionId = `q-${passageIndex}-${group.id}-${q.question_number}`;
                
                const baseQuestion = {
                  id: questionId,
                  type: q.question_type as Question['type'],
                  questionNumber: q.question_number,
                  text: q.question_text,
                  answer: q.correct_answer?.answer || '',
                };

                if (q.question_type === 'MULTIPLE_CHOICE' && q.options) {
                  allQuestions.push({
                    ...baseQuestion,
                    type: 'MULTIPLE_CHOICE' as const,
                    options: q.options.map((opt) => opt.text),
                  } as Question);
                } else {
                  allQuestions.push(baseQuestion as Question);
                }
              });
            });
          });

          // Calculate score
          const calculatedResults = calculateScore(allQuestions, studentAnswers);
          
          // Calculate band score (IELTS band 1-9)
          const bandScore = calculatedResults.score >= 90 ? 9 :
                           calculatedResults.score >= 80 ? 8 :
                           calculatedResults.score >= 70 ? 7 :
                           calculatedResults.score >= 60 ? 6 :
                           calculatedResults.score >= 50 ? 5 :
                           calculatedResults.score >= 40 ? 4 :
                           calculatedResults.score >= 30 ? 3 :
                           calculatedResults.score >= 20 ? 2 : 1;

          setResults({
            ...calculatedResults,
            bandScore,
            answers: studentAnswers.map((sa, index) => ({
              ...sa,
              isCorrect: calculatedResults.answers[index]?.isCorrect,
            })),
          });
        }
      } catch (err) {
        console.error('Failed to load results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId, fetchSessionById, currentSession, user]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="text-slate-400">Loading results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !results || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">{error || 'Results not found'}</p>
            <Button
              onClick={() => navigate('/student/sessions')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500"
            >
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeSpent = attempt.started_at && attempt.submitted_at
    ? Math.floor((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
    : 0;

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
                <Home className="h-4 w-4 mr-2" />
                Back to Sessions
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-3xl mb-2">Test Results</CardTitle>
            <CardDescription className="text-slate-400">
              {currentSession?.title || 'Session Results'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-indigo-400">{results.score}%</p>
                  <p className="text-sm text-slate-400">Score</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-green-400">{results.correctAnswers}</p>
                  <p className="text-sm text-slate-400">Correct</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-red-400">{results.incorrectAnswers}</p>
                  <p className="text-sm text-slate-400">Incorrect</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-blue-400">{results.bandScore}</p>
                  <p className="text-sm text-slate-400">Band Score</p>
                </CardContent>
              </Card>
            </div>

            {/* Tab Violations Warning */}
            {attempt.tab_violations > 0 && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You switched tabs {attempt.tab_violations} time{attempt.tab_violations > 1 ? 's' : ''} during the test.
                </AlertDescription>
              </Alert>
            )}

            {/* Time Spent */}
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Time spent: {timeSpent} minutes</span>
            </div>

            {/* Answer Review */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Answer Review</h3>
              {results.answers.map((answer, index) => (
                <Card
                  key={index}
                  className={`${
                    answer.isCorrect
                      ? 'bg-green-950/30 border-green-500/50'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-white">
                          Question {answer.questionNumber}
                        </p>
                        <p className="text-sm text-slate-400">
                          Your answer: {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer || '(Not answered)'}
                        </p>
                      </div>
                      <Badge
                        variant={answer.isCorrect ? 'default' : 'destructive'}
                        className={
                          answer.isCorrect
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {answer.isCorrect ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/student/sessions')}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                Back to Sessions
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/student')}
                className="border-slate-700"
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

