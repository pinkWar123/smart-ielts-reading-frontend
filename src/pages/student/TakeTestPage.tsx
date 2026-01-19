import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTestStore } from '@/lib/stores/testStore';
import { useTabDetection } from '@/hooks/useTabDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  GripVertical,
  Highlighter,
  BookOpen,
  Send,
  X,
  Trash2,
  MessageSquare,
  Palette,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { calculateScore } from '@/lib/utils/scoring';
import { testsApi, type GetTestDetailWithViewResponse, type TestDetailPassageDTO, type PassageDetailQuestionGroupDTO, type PassageDetailQuestionDTO } from '@/lib/api/tests';
import type { TestResult } from '@/lib/types/test';

// Convert API question to internal format
interface InternalQuestion {
  id: string;
  type: string;
  questionNumber: number;
  text: string;
  options?: string[];
  answer?: string | string[];
  wordLimit?: number;
  headings?: { id: string; text: string }[];
  paragraphs?: string[];
  features?: { id: string; text: string }[];
}

// Question Renderer Component (inline for now)
const QuestionItem: React.FC<{
  question: InternalQuestion;
  answer: string | string[] | undefined;
  onAnswerChange: (answer: string | string[]) => void;
  isActive: boolean;
}> = ({ question, answer, onAnswerChange, isActive }) => {
  const renderInput = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2 mt-3">
            {question.options?.map((option, idx) => (
              <label 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  answer === option 
                    ? 'bg-emerald-950/50 border border-emerald-500/50' 
                    : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={() => onAnswerChange(option)}
                  className="w-4 h-4 text-emerald-500 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE_NOTGIVEN':
      case 'TRUE_FALSE_NOT_GIVEN':
        return (
          <div className="flex gap-2 mt-3">
            {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
              <button
                key={opt}
                onClick={() => onAnswerChange(opt)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  answer === opt
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case 'YES_NO_NOTGIVEN':
      case 'YES_NO_NOT_GIVEN':
        return (
          <div className="flex gap-2 mt-3">
            {['YES', 'NO', 'NOT GIVEN'].map((opt) => (
              <button
                key={opt}
                onClick={() => onAnswerChange(opt)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  answer === opt
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case 'MATCHING_HEADINGS':
        return (
          <div className="space-y-2 mt-3">
            {question.headings?.map((heading) => (
              <label 
                key={heading.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  answer === heading.id 
                    ? 'bg-emerald-950/50 border border-emerald-500/50' 
                    : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={heading.id}
                  checked={answer === heading.id}
                  onChange={() => onAnswerChange(heading.id)}
                  className="w-4 h-4 text-emerald-500 border-slate-600"
                />
                <span className="text-sm text-slate-300">{heading.text}</span>
              </label>
            ))}
          </div>
        );

      case 'MATCHING_INFORMATION':
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {question.paragraphs?.map((para) => (
              <button
                key={para}
                onClick={() => onAnswerChange(para)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                  answer === para
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {para}
              </button>
            ))}
          </div>
        );

      case 'MATCHING_FEATURES':
        return (
          <div className="space-y-2 mt-3">
            {question.features?.map((feature) => (
              <label 
                key={feature.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  answer === feature.id 
                    ? 'bg-emerald-950/50 border border-emerald-500/50' 
                    : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={feature.id}
                  checked={answer === feature.id}
                  onChange={() => onAnswerChange(feature.id)}
                  className="w-4 h-4 text-emerald-500 border-slate-600"
                />
                <span className="text-sm text-slate-300">{feature.text}</span>
              </label>
            ))}
          </div>
        );

      default:
        // Text input for completion questions
        return (
          <div className="mt-3">
            <input
              type="text"
              value={(answer as string) || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {question.wordLimit && (
              <p className="text-xs text-slate-500 mt-2">
                Maximum {question.wordLimit} word{question.wordLimit > 1 ? 's' : ''}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div
      id={`question-${question.questionNumber}`}
      className={`p-4 rounded-xl transition-all ${
        isActive 
          ? 'bg-emerald-950/30 border border-emerald-500/30' 
          : 'bg-slate-900/50 border border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          answer 
            ? 'bg-emerald-600 text-white' 
            : 'bg-slate-700 text-slate-400'
        }`}>
          {question.questionNumber}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 text-sm leading-relaxed">{question.text}</p>
          {renderInput()}
        </div>
      </div>
    </div>
  );
};

export const TakeTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get config from URL params
  const testId = searchParams.get('testId');
  const timeMinutes = parseInt(searchParams.get('time') || '20', 10);
  const passageIndices = (searchParams.get('passages') || '0').split(',').map(Number);
  
  // State
  const [testData, setTestData] = useState<GetTestDetailWithViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(timeMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState<number | null>(null);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<{ passageIndex: number; highlightIndex: number } | null>(null);
  const [highlightComment, setHighlightComment] = useState('');
  const highlights = useRef<Map<number, Array<{ 
    id: string;
    start: number; 
    end: number; 
    text: string;
    color: string;
    comment?: string;
  }>>>(new Map());
  const [highlightUpdateTrigger, setHighlightUpdateTrigger] = useState(0);
  const passageContentRef = useRef<HTMLDivElement>(null);

  const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-400/30', text: 'text-yellow-200', border: 'border-yellow-400/50' },
    { name: 'Green', value: 'green', bg: 'bg-green-400/30', text: 'text-green-200', border: 'border-green-400/50' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-400/30', text: 'text-blue-200', border: 'border-blue-400/50' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-400/30', text: 'text-pink-200', border: 'border-pink-400/50' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-400/30', text: 'text-purple-200', border: 'border-purple-400/50' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-400/30', text: 'text-orange-200', border: 'border-orange-400/50' },
  ];
  
  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  // Tab detection
  useTabDetection({
    onTabSwitch: () => setTabSwitchCount(prev => prev + 1),
    onWarning: (message) => {
      setWarningMessage(message);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    },
    enableBlocking: false,
  });

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setError('No test ID provided');
        setLoading(false);
        return;
      }

      try {
        const data = await testsApi.getTestDetailWithView(testId, 'USER');
        setTestData(data);
      } catch (err) {
        console.error('Failed to load test:', err);
        setError(err instanceof Error ? err.message : 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (loading || isSubmitted) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isSubmitted]);

  // Handle panel resize
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit to 25-75%
    const clampedWidth = Math.min(Math.max(newWidth, 25), 75);
    setLeftPanelWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle text highlighting
  const handleTextSelection = useCallback(() => {
    if (!isHighlightMode || !passageContentRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) {
      selection.removeAllRanges();
      return;
    }

    // Check if selection is within the passage content
    const passageElement = passageContentRef.current;
    if (!passageElement.contains(range.commonAncestorContainer)) {
      selection.removeAllRanges();
      return;
    }

    // Get the original plain text content (without any HTML/mark elements)
    if (!testData) {
      selection.removeAllRanges();
      return;
    }
    const actualIndex = passageIndices[currentPassageIndex];
    const currentPassage = testData.passages[actualIndex];
    if (!currentPassage) {
      selection.removeAllRanges();
      return;
    }
    const passageText = currentPassage.content;
    
    // Calculate positions by creating ranges from the start of the element
    // This works even if there are mark elements because we're using textContent
    const beforeRange = document.createRange();
    beforeRange.setStart(passageElement, 0);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const start = beforeRange.toString().length;

    const afterRange = document.createRange();
    afterRange.setStart(passageElement, 0);
    afterRange.setEnd(range.endContainer, range.endOffset);
    const end = afterRange.toString().length;

    // Only add if it's a valid range and not already highlighted
    if (start < end && start >= 0 && end <= passageText.length) {
      const passageHighlights = highlights.current.get(currentPassageIndex) || [];
      
      // Check if this exact range is already highlighted (with small tolerance for rounding)
      const isDuplicate = passageHighlights.some(
        h => Math.abs(h.start - start) < 2 && Math.abs(h.end - end) < 2
      );
      
      if (!isDuplicate) {
        const newHighlight = {
          id: crypto.randomUUID(),
          start,
          end,
          text,
          color: selectedHighlightColor,
        };
        
        highlights.current.set(currentPassageIndex, [
          ...passageHighlights,
          newHighlight
        ]);
        setHighlightUpdateTrigger(prev => prev + 1);
      }
    }

    selection.removeAllRanges();
  }, [isHighlightMode, currentPassageIndex, testData, passageIndices, selectedHighlightColor]);

  // Scroll to question
  const scrollToQuestion = useCallback((questionNumber: number) => {
    setActiveQuestionNumber(questionNumber);
    const element = document.getElementById(`question-${questionNumber}`);
    if (element && questionsContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setActiveQuestionNumber(null), 2000);
  }, []);

  // Handle answer change
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit test
  const handleSubmit = useCallback(() => {
    if (!testData) return;

    // Collect all questions from selected passages
    const selectedPassages = passageIndices.map(idx => testData.passages[idx]).filter(Boolean);
    const allQuestions: InternalQuestion[] = [];
    
    selectedPassages.forEach(passage => {
      passage.question_groups.forEach(group => {
        group.questions?.forEach(q => {
          allQuestions.push({
            id: `q-${q.question_number}`,
            type: q.question_type,
            questionNumber: q.question_number,
            text: q.question_text,
            options: q.options?.map(o => `${o.label}. ${o.text}`),
          });
        });
      });
    });

    const studentAnswers = allQuestions.map(q => ({
      questionId: q.id,
      questionNumber: q.questionNumber,
      answer: answers.get(q.id) || '',
    }));

    // Calculate results
    const correctAnswers = studentAnswers.filter(a => {
      // In user view we don't have correct answers, so mark all as pending review
      return false;
    }).length;

    const result: TestResult = {
      attemptId: crypto.randomUUID(),
      testId: testId || '',
      totalQuestions: allQuestions.length,
      correctAnswers: 0, // Will be calculated by backend
      incorrectAnswers: 0,
      score: 0,
      answers: studentAnswers,
      tabSwitchCount,
      timeSpent: timeMinutes - Math.floor(timeRemaining / 60),
    };

    setTestResult(result);
    setIsSubmitted(true);
  }, [testData, passageIndices, answers, testId, tabSwitchCount, timeMinutes, timeRemaining]);

  // Get current passage data
  const getCurrentPassage = (): TestDetailPassageDTO | null => {
    if (!testData) return null;
    const actualIndex = passageIndices[currentPassageIndex];
    return testData.passages[actualIndex] || null;
  };

  // Get all questions for current passage
  const getCurrentQuestions = (): InternalQuestion[] => {
    const passage = getCurrentPassage();
    if (!passage) return [];

    const questions: InternalQuestion[] = [];
    passage.question_groups.forEach(group => {
      group.questions?.forEach(q => {
        questions.push({
          id: `q-${q.question_number}`,
          type: q.question_type,
          questionNumber: q.question_number,
          text: q.question_text,
          options: q.options?.map(o => `${o.label}. ${o.text}`),
          wordLimit: 3, // Default for completion questions
        });
      });
    });

    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
  };

  // Get all questions across selected passages
  const getAllQuestions = (): InternalQuestion[] => {
    if (!testData) return [];
    
    const questions: InternalQuestion[] = [];
    passageIndices.forEach(idx => {
      const passage = testData.passages[idx];
      if (!passage) return;
      
      passage.question_groups.forEach(group => {
        group.questions?.forEach(q => {
          questions.push({
            id: `q-${q.question_number}`,
            type: q.question_type,
            questionNumber: q.question_number,
            text: q.question_text,
            options: q.options?.map(o => `${o.label}. ${o.text}`),
          });
        });
      });
    });

    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
  };

  // Get question range for a passage
  const getPassageQuestionRange = (passageIdx: number): { start: number; end: number } | null => {
    if (!testData) return null;
    const actualIdx = passageIndices[passageIdx];
    const passage = testData.passages[actualIdx];
    if (!passage || !passage.question_groups.length) return null;

    const questions: number[] = [];
    passage.question_groups.forEach(group => {
      group.questions?.forEach(q => questions.push(q.question_number));
    });

    if (!questions.length) return null;
    return { start: Math.min(...questions), end: Math.max(...questions) };
  };

  // Remove highlight
  const removeHighlight = useCallback((passageIndex: number, highlightId: string) => {
    const passageHighlights = highlights.current.get(passageIndex) || [];
    highlights.current.set(
      passageIndex,
      passageHighlights.filter(h => h.id !== highlightId)
    );
    setHighlightUpdateTrigger(prev => prev + 1);
    setEditingHighlight(null);
  }, []);

  // Add or update comment on highlight
  const saveHighlightComment = useCallback((passageIndex: number, highlightId: string, comment: string) => {
    const passageHighlights = highlights.current.get(passageIndex) || [];
    const updated = passageHighlights.map(h => 
      h.id === highlightId ? { ...h, comment } : h
    );
    highlights.current.set(passageIndex, updated);
    setHighlightUpdateTrigger(prev => prev + 1);
    setEditingHighlight(null);
    setHighlightComment('');
  }, []);

  // Highlight text in passage content
  const renderHighlightedContent = (content: string) => {
    const passageHighlights = highlights.current.get(currentPassageIndex) || [];
    if (!passageHighlights.length) {
      return <span className="whitespace-pre-wrap">{content}</span>;
    }

    // Sort highlights by start position
    const sortedHighlights = [...passageHighlights].sort((a, b) => a.start - b.start);
    
    // Build the highlighted content by inserting mark tags at specific positions
    const parts: Array<string | JSX.Element> = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight) => {
      // Add text before this highlight
      if (highlight.start > lastIndex) {
        parts.push(content.substring(lastIndex, highlight.start));
      }
      
      // Add the highlighted text with color
      const highlightedText = content.substring(highlight.start, highlight.end);
      const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === highlight.color) || HIGHLIGHT_COLORS[0];
      
      parts.push(
        <mark
          key={highlight.id}
          className={`${colorConfig.bg} ${colorConfig.text} px-0.5 rounded cursor-pointer hover:${colorConfig.border} border transition-all relative group inline-flex items-center gap-1`}
          onClick={(e) => {
            e.stopPropagation();
            setEditingHighlight({ passageIndex: currentPassageIndex, highlightIndex: passageHighlights.indexOf(highlight) });
            setHighlightComment(highlight.comment || '');
          }}
          title={highlight.comment || 'Click to add comment or delete'}
        >
          {highlightedText}
          {highlight.comment && (
            <MessageSquare className="w-3 h-3 opacity-70" />
          )}
          {highlight.comment && (
            <span className="absolute -top-8 left-0 bg-slate-800 text-xs text-slate-300 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-normal max-w-xs z-50 border border-slate-700">
              {highlight.comment}
            </span>
          )}
        </mark>
      );
      
      lastIndex = highlight.end;
    });

    // Add remaining text after last highlight
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return <span className="whitespace-pre-wrap">{parts}</span>;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Test</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => navigate('/student')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted && testResult) {
    return (
      <div className="min-h-screen bg-[#0f0f13] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Test Submitted!</h2>
                <p className="text-slate-400">Your answers have been recorded.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-400">{testResult.totalQuestions}</p>
                  <p className="text-sm text-slate-500 mt-1">Total Questions</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{answers.size}</p>
                  <p className="text-sm text-slate-500 mt-1">Answered</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">{testResult.totalQuestions - answers.size}</p>
                  <p className="text-sm text-slate-500 mt-1">Unanswered</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{testResult.timeSpent} min</p>
                  <p className="text-sm text-slate-500 mt-1">Time Spent</p>
                </div>
              </div>

              {tabSwitchCount > 0 && (
                <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Tab Switches Detected</AlertTitle>
                  <AlertDescription>
                    You switched tabs {tabSwitchCount} time{tabSwitchCount > 1 ? 's' : ''} during the test.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => navigate('/student')}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentPassage = getCurrentPassage();
  const currentQuestions = getCurrentQuestions();
  const allQuestions = getAllQuestions();

  return (
    <div className="h-screen flex flex-col bg-[#0f0f13] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#1a1a1f] border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
                  navigate('/student');
                }
              }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {testData?.test_metadata.title}
              </h1>
              <p className="text-sm text-slate-500">
                Passage {currentPassageIndex + 1} of {passageIndices.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Highlight Toggle with Color Picker */}
            <div className="relative">
              <button
                onClick={() => setIsHighlightMode(!isHighlightMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isHighlightMode 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                Highlight
              </button>
              
              {isHighlightMode && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-3 z-50 min-w-[200px]">
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-2">Select Color:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {HIGHLIGHT_COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setSelectedHighlightColor(color.value);
                            setShowColorPicker(false);
                          }}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            selectedHighlightColor === color.value
                              ? `${color.border} ${color.bg}`
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                          title={color.name}
                        >
                          <div className={`w-full h-6 rounded ${color.bg} ${color.border} border`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Select text to highlight with {HIGHLIGHT_COLORS.find(c => c.value === selectedHighlightColor)?.name.toLowerCase()} color
                  </p>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              timeRemaining < 300 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-slate-800 text-white'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>

            {/* Tab Switch Warning */}
            {tabSwitchCount > 0 && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Warning Alert */}
      {showWarning && (
        <Alert variant="destructive" className="mx-4 mt-2 bg-red-950/50 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {/* Highlight Management Panel */}
      {editingHighlight && (() => {
        const passageHighlights = highlights.current.get(editingHighlight.passageIndex) || [];
        const highlight = passageHighlights[editingHighlight.highlightIndex];
        if (!highlight) return null;
        
        const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === highlight.color) || HIGHLIGHT_COLORS[0];
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingHighlight(null);
                setHighlightComment('');
              }
            }}
          >
            <Card 
              className="bg-slate-900 border-slate-700 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${colorConfig.bg} ${colorConfig.border} border`} />
                    Highlight Options
                  </h3>
                  <button
                    onClick={() => {
                      setEditingHighlight(null);
                      setHighlightComment('');
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Highlighted Text:</p>
                  <p className="text-sm text-slate-200">"{highlight.text}"</p>
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Comment (optional):
                  </label>
                  <Textarea
                    value={highlightComment}
                    onChange={(e) => setHighlightComment(e.target.value)}
                    placeholder="Add a note about this highlight..."
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[80px]"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (highlightComment.trim()) {
                        saveHighlightComment(editingHighlight.passageIndex, highlight.id, highlightComment.trim());
                      } else {
                        setEditingHighlight(null);
                        setHighlightComment('');
                      }
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      removeHighlight(editingHighlight.passageIndex, highlight.id);
                    }}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Main Content - Resizable Panels */}
      <div 
        ref={containerRef} 
        className="flex-1 flex overflow-hidden"
      >
        {/* Passage Panel (Left) */}
        <div 
          className="overflow-hidden flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div 
            className="flex-1 overflow-y-auto p-6"
            onMouseUp={handleTextSelection}
          >
            {currentPassage && (
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentPassage.title}
                </h2>
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="outline" className="text-slate-400 border-slate-700">
                    {currentPassage.topic}
                  </Badge>
                  {currentPassage.difficulty_level && (
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      Level {currentPassage.difficulty_level}
                    </Badge>
                  )}
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <div 
                    ref={passageContentRef}
                    className="text-slate-300 leading-relaxed text-[15px]"
                    key={`passage-${currentPassageIndex}-${highlightUpdateTrigger}`}
                  >
                    {renderHighlightedContent(currentPassage.content)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 flex-shrink-0 flex items-center justify-center cursor-col-resize hover:bg-slate-700/50 transition-colors ${
            isDragging ? 'bg-emerald-500/30' : 'bg-slate-800'
          }`}
        >
          <GripVertical className="w-4 h-4 text-slate-600" />
        </div>

        {/* Questions Panel (Right) */}
        <div 
          className="overflow-hidden flex flex-col bg-[#15151a]"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Questions List with Group Instructions */}
          <div 
            ref={questionsContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {currentPassage?.question_groups.map((group, groupIdx) => {
              // Get questions for this group
              const groupQuestions = currentQuestions.filter(
                q => q.questionNumber >= group.start_question_number && 
                     q.questionNumber <= group.end_question_number
              );

              return (
                <div key={group.id || groupIdx} className="space-y-4">
                  {/* Question Group Instructions */}
                  <div className="px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-emerald-400">
                        Questions {group.start_question_number}-{group.end_question_number}:
                      </span>{' '}
                      {group.group_instructions}
                    </p>
                  </div>

                  {/* Questions for this group */}
                  {groupQuestions.map(question => (
                    <QuestionItem
                      key={question.id}
                      question={question}
                      answer={answers.get(question.id)}
                      onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                      isActive={activeQuestionNumber === question.questionNumber}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="flex-shrink-0 bg-[#1a1a1f] border-t border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Passage Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPassageIndex(prev => prev - 1)}
              disabled={currentPassageIndex === 0}
              className="border-slate-700 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            {/* Passage Tabs */}
            {passageIndices.length > 1 && (
              <div className="flex items-center gap-1 mx-2">
                {passageIndices.map((_, idx) => {
                  const range = getPassageQuestionRange(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPassageIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPassageIndex === idx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      P{idx + 1}
                      {range && (
                        <span className="ml-1 text-xs opacity-70">
                          ({range.start}-{range.end})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPassageIndex(prev => prev + 1)}
              disabled={currentPassageIndex === passageIndices.length - 1}
              className="border-slate-700 hover:bg-slate-800"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Question Numbers Navigation */}
          <div className="flex-1 mx-4 overflow-x-auto">
            <div className="flex items-center gap-1 justify-center">
              {allQuestions.map(q => (
                <button
                  key={q.questionNumber}
                  onClick={() => {
                    // Find which passage this question belongs to
                    for (let i = 0; i < passageIndices.length; i++) {
                      const range = getPassageQuestionRange(i);
                      if (range && q.questionNumber >= range.start && q.questionNumber <= range.end) {
                        setCurrentPassageIndex(i);
                        setTimeout(() => scrollToQuestion(q.questionNumber), 100);
                        break;
                      }
                    }
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    answers.has(q.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  } ${activeQuestionNumber === q.questionNumber ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  {q.questionNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => {
              if (confirm('Are you sure you want to submit the test?')) {
                handleSubmit();
              }
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Test
          </Button>
        </div>
      </footer>
    </div>
  );
};

