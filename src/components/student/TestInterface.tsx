import React, { useEffect, useState, useCallback } from 'react';
import { useTestStore } from '@/lib/stores/testStore';
import { useTabDetection } from '@/hooks/useTabDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QuestionRenderer } from '@/components/student/QuestionRenderer';
import { AlertCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { calculateScore } from '@/lib/utils/scoring';
import type { Question } from '@/lib/types/question';
import type { TestResult } from '@/lib/types/test';

export const TestInterface: React.FC = () => {
  const {
    currentTest,
    currentPassageIndex,
    answers,
    tabSwitchCount,
    timeRemaining,
    startTime,
    setAnswer,
    goToPassage,
    recordTabSwitch,
    submitTest,
    setTimeRemaining,
  } = useTestStore();

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Tab detection
  useTabDetection({
    onTabSwitch: recordTabSwitch,
    onWarning: (message) => {
      setWarningMessage(message);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    },
    enableBlocking: false,
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(() => {
    if (!currentTest) return;

    const studentAnswers = submitTest();

    // Collect all questions
    const allQuestions: Question[] = [];
    currentTest.passages.forEach(passage => {
      passage.questionGroups.forEach(group => {
        allQuestions.push(...group.questions);
      });
    });

    const result = calculateScore(allQuestions, studentAnswers);
    result.attemptId = crypto.randomUUID();
    result.testId = currentTest.id;
    result.tabSwitchCount = tabSwitchCount;
    result.timeSpent = currentTest.timeLimit - Math.floor(timeRemaining / 60);

    setTestResult(result);
    setIsSubmitted(true);
  }, [currentTest, submitTest, tabSwitchCount, timeRemaining]);

  // Timer
  useEffect(() => {
    if (!startTime || isSubmitted) return;

    const interval = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);

      if (timeRemaining <= 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, startTime, isSubmitted, handleSubmit, setTimeRemaining]);

  if (!currentTest) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No test selected</p>
      </div>
    );
  }

  if (isSubmitted && testResult) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Test Results</h2>
              <p className="text-muted-foreground">Here's how you performed</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-primary">{testResult.score}%</p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-green-600">{testResult.correctAnswers}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-red-600">{testResult.incorrectAnswers}</p>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-blue-600">{testResult.bandScore}</p>
                  <p className="text-sm text-muted-foreground">Band Score</p>
                </CardContent>
              </Card>
            </div>

            {tabSwitchCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You switched tabs {tabSwitchCount} time{tabSwitchCount > 1 ? 's' : ''} during the test.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Answer Review</h3>
              {testResult.answers.map((answer, index: number) => (
                <Card key={index} className={answer.isCorrect ? 'border-green-500' : 'border-red-500'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Question {answer.questionNumber}</p>
                        <p className="text-sm">Your answer: {answer.answer || '(Not answered)'}</p>
                      </div>
                      <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={() => window.location.href = '/'}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPassage = currentTest.passages[currentPassageIndex];
  const allQuestions = currentPassage.questionGroups.flatMap(group => group.questions);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{currentTest.title}</h1>
          <p className="text-sm opacity-90">
            Passage {currentPassageIndex + 1} of {currentTest.passages.length}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono">{formatTime(timeRemaining)}</span>
          </div>
          {tabSwitchCount > 0 && (
            <Badge variant="destructive">
              {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
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
        <div className="w-1/2 border-r overflow-y-auto p-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">{currentPassage.title}</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {currentPassage.content}
            </div>
          </div>
        </div>

        {/* Questions Panel */}
        <div className="w-1/2 overflow-y-auto p-6 bg-muted/30">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              Questions {currentPassage.questionGroups[0]?.startNumber} - {currentPassage.questionGroups[0]?.endNumber}
            </h3>

            {allQuestions.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                answer={answers.get(question.id)}
                onAnswerChange={(answer) => setAnswer(question.id, answer)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between bg-background">
        <Button
          variant="outline"
          onClick={() => goToPassage(currentPassageIndex - 1)}
          disabled={currentPassageIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Passage
        </Button>

        {currentPassageIndex === currentTest.passages.length - 1 ? (
          <Button onClick={handleSubmit} size="lg">
            Submit Test
          </Button>
        ) : (
          <Button onClick={() => goToPassage(currentPassageIndex + 1)}>
            Next Passage
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

