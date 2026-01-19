import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Edit2,
  Check,
  BookOpen,
  Hash,
  Star,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  PenLine,
  ChevronLeft,
} from 'lucide-react';
import {
  testsApi,
  passagesApi,
  ocrApi,
  type TestResponse,
  type ExtractedTestResponse,
  type ExtractedPassage,
  type ExtractedQuestion,
  type CreateCompletePassageRequest,
  type QuestionDTO,
  type QuestionGroupDTO,
  type TestType,
} from '@/lib/api/tests';

// ==================== Types ====================

type WorkflowStep =
  | 'test-details'
  | 'add-passage-method'
  | 'upload-images'
  | 'extracting'
  | 'preview-edit'
  | 'complete';

interface EditableExtractedPassage extends ExtractedPassage {
  _editKey?: string; // For tracking in UI
}

// ==================== Helper Functions ====================

const questionTypeLabels: Record<string, string> = {
  TRUE_FALSE_NOTGIVEN: 'True / False / Not Given',
  YES_NO_NOTGIVEN: 'Yes / No / Not Given',
  MULTIPLE_CHOICE: 'Multiple Choice',
  NOTE_COMPLETION: 'Note Completion',
  SENTENCE_COMPLETION: 'Sentence Completion',
  SUMMARY_COMPLETION: 'Summary Completion',
  SHORT_ANSWER: 'Short Answer',
  MATCHING_HEADINGS: 'Matching Headings',
  MATCHING_INFORMATION: 'Matching Information',
  MATCHING_FEATURES: 'Matching Features',
  MATCHING_SENTENCE_ENDINGS: 'Matching Sentence Endings',
  DIAGRAM_LABEL_COMPLETION: 'Diagram Label',
  TABLE_COMPLETION: 'Table Completion',
  FLOW_CHART_COMPLETION: 'Flow Chart',
};

const getAnswerString = (correctAnswer: { answer?: string | string[] | null; acceptable_answers?: string[] }): string => {
  if (correctAnswer.answer === null || correctAnswer.answer === undefined) {
    return '';
  }
  if (Array.isArray(correctAnswer.answer)) {
    return correctAnswer.answer.join(', ');
  }
  return String(correctAnswer.answer);
};

const convertExtractedToCreateRequest = (passage: ExtractedPassage): CreateCompletePassageRequest => {
  // Create a map of group IDs to their options for quick lookup
  const groupOptionsMap = new Map<string, boolean>();
  passage.question_groups.forEach((g) => {
    groupOptionsMap.set(g.id, !!(g.options && g.options.length > 0));
  });

  const questionGroups: QuestionGroupDTO[] = passage.question_groups.map((g) => ({
    id: g.id,
    group_instructions: g.group_instructions,
    question_type: g.question_type,
    start_question_number: g.start_question_number,
    end_question_number: g.end_question_number,
    order_in_passage: g.order_in_passage,
    // Include options if the group has them
    options: g.options && g.options.length > 0 ? g.options : null,
  }));

  const questions: QuestionDTO[] = passage.questions.map((q) => {
    // Check if this question's group has options
    const groupHasOptions = q.question_group_id ? groupOptionsMap.get(q.question_group_id) : false;
    
    return {
      question_number: q.question_number,
      question_type: q.question_type,
      question_text: q.question_text,
      // Include options on question if the group doesn't have shared options
      options: groupHasOptions ? null : q.options,
      correct_answer: {
        answer: q.correct_answer.answer,
        acceptable_answers: q.correct_answer.acceptable_answers,
      },
      explanation: q.explanation,
      instructions: q.instructions,
      points: q.points || 1,
      order_in_passage: q.order_in_passage,
      question_group_id: q.question_group_id,
    };
  });

  return {
    title: passage.title,
    content: passage.content,
    difficulty_level: passage.difficulty_level || 1,
    topic: passage.topic,
    source: passage.source,
    question_groups: questionGroups,
    questions,
  };
};

// ==================== Sub Components ====================

interface StepIndicatorProps {
  steps: { id: WorkflowStep; label: string; description: string }[];
  currentStep: WorkflowStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  const getStepStatus = (stepId: WorkflowStep): 'completed' | 'current' | 'upcoming' => {
    const stepOrder = steps.map((s) => s.id);
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : status === 'current'
                    ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                    : 'border-slate-600 text-slate-500'
                }`}
              >
                {status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${status === 'current' ? 'text-white' : 'text-slate-400'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-slate-500 hidden sm:block">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors ${
                  getStepStatus(steps[index + 1].id) !== 'upcoming' ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== Main Component ====================

export const TestBuilder: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('test-details');
  const [error, setError] = useState<string | null>(null);

  // Test details state
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testType, setTestType] = useState<TestType>('FULL_TEST');
  const [timeLimit, setTimeLimit] = useState(60);

  // Created test state
  const [createdTest, setCreatedTest] = useState<TestResponse | null>(null);

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [extractionHint, setExtractionHint] = useState('');

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedTestResponse | null>(null);

  // Editable passage state
  const [editablePassage, setEditablePassage] = useState<EditableExtractedPassage | null>(null);
  const [isEditingPassage, setIsEditingPassage] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  // Temp edit states
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');
  const [tempQuestionText, setTempQuestionText] = useState('');
  const [tempCorrectAnswer, setTempCorrectAnswer] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedPassageIds, setAddedPassageIds] = useState<string[]>([]);

  // Steps definition
  const STEPS: { id: WorkflowStep; label: string; description: string }[] = [
    { id: 'test-details', label: 'Test Details', description: 'Create test' },
    { id: 'add-passage-method', label: 'Add Passage', description: 'Choose method' },
    { id: 'upload-images', label: 'Upload', description: 'Select images' },
    { id: 'extracting', label: 'Extracting', description: 'AI processing' },
    { id: 'preview-edit', label: 'Preview', description: 'Review & edit' },
  ];

  // Simulate extraction progress
  useEffect(() => {
    if (isExtracting) {
      const interval = setInterval(() => {
        setExtractionProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isExtracting]);

  // ==================== Handlers ====================

  const handleCreateTest = async () => {
    if (!testTitle.trim()) {
      setError('Please enter a test title');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const test = await testsApi.createTest({
        title: testTitle,
        description: testDescription || undefined,
        test_type: testType,
        time_limit_minutes: timeLimit,
      });

      setCreatedTest(test);
      setCurrentStep('add-passage-method');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartExtraction = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setError(null);
    setIsExtracting(true);
    setExtractionProgress(0);
    setCurrentStep('extracting');

    try {
      const result = await ocrApi.extractTestFromImages(
        selectedImages,
        testTitle,
        extractionHint || undefined
      );

      setExtractedData(result);
      setExtractionProgress(100);

      // Set the first passage as editable
      if (result.passages.length > 0) {
        setEditablePassage({
          ...result.passages[0],
          _editKey: Date.now().toString(),
        });
      }

      setTimeout(() => {
        setCurrentStep('preview-edit');
        setIsExtracting(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract test from images');
      setIsExtracting(false);
      setCurrentStep('upload-images');
    }
  };

  const handleStartEditPassage = () => {
    if (editablePassage) {
      setTempTitle(editablePassage.title);
      setTempContent(editablePassage.content);
      setIsEditingPassage(true);
    }
  };

  const handleSavePassageEdit = () => {
    if (editablePassage) {
      setEditablePassage({
        ...editablePassage,
        title: tempTitle,
        content: tempContent,
      });
      setIsEditingPassage(false);
    }
  };

  const handleCancelPassageEdit = () => {
    setIsEditingPassage(false);
    setTempTitle('');
    setTempContent('');
  };

  const handleStartEditQuestion = (question: ExtractedQuestion) => {
    setEditingQuestionId(question.question_number);
    setTempQuestionText(question.question_text);
    setTempCorrectAnswer(getAnswerString(question.correct_answer));
  };

  const handleSaveQuestionEdit = (questionNumber: number) => {
    if (editablePassage) {
      const updatedQuestions = editablePassage.questions.map((q) =>
        q.question_number === questionNumber
          ? {
              ...q,
              question_text: tempQuestionText,
              correct_answer: {
                ...q.correct_answer,
                answer: tempCorrectAnswer,
              },
            }
          : q
      );
      setEditablePassage({
        ...editablePassage,
        questions: updatedQuestions,
      });
    }
    setEditingQuestionId(null);
    setTempQuestionText('');
    setTempCorrectAnswer('');
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setTempQuestionText('');
    setTempCorrectAnswer('');
  };

  const handleQuickAnswerUpdate = (questionNumber: number, newAnswer: string) => {
    if (editablePassage) {
      const updatedQuestions = editablePassage.questions.map((q) =>
        q.question_number === questionNumber
          ? {
              ...q,
              correct_answer: {
                ...q.correct_answer,
                answer: newAnswer,
              },
            }
          : q
      );
      setEditablePassage({
        ...editablePassage,
        questions: updatedQuestions,
      });
    }
  };

  const handleAddPassageToTest = async () => {
    if (!editablePassage || !createdTest) {
      setError('Missing passage or test data');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // First create the passage
      const passageRequest = convertExtractedToCreateRequest(editablePassage);
      const createdPassage = await passagesApi.createCompletePassage(passageRequest);

      // Then add it to the test
      const updatedTest = await testsApi.addPassageToTest(createdTest.id, createdPassage.id);
      setCreatedTest(updatedTest);
      setAddedPassageIds((prev) => [...prev, createdPassage.id]);

      // Check if we should add more passages or complete
      const maxPassages = testType === 'FULL_TEST' ? 3 : 1;
      if (addedPassageIds.length + 1 >= maxPassages) {
        setCurrentStep('complete');
      } else {
        // Reset for next passage
        setSelectedImages([]);
        setExtractedData(null);
        setEditablePassage(null);
        setExtractionHint('');
        setCurrentStep('add-passage-method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add passage to test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnotherPassage = () => {
    setSelectedImages([]);
    setExtractedData(null);
    setEditablePassage(null);
    setExtractionHint('');
    setCurrentStep('add-passage-method');
  };

  // Group questions by their question_group_id
  const groupedQuestions = React.useMemo(() => {
    if (!editablePassage) return new Map<string, ExtractedQuestion[]>();
    const groups = new Map<string, ExtractedQuestion[]>();
    editablePassage.questions.forEach((q) => {
      const groupId = q.question_group_id || 'ungrouped';
      const existing = groups.get(groupId) || [];
      groups.set(groupId, [...existing, q].sort((a, b) => a.question_number - b.question_number));
    });
    return groups;
  }, [editablePassage]);

  // ==================== Render Functions ====================

  const renderTestDetails = () => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5 text-indigo-400" />
          Test Details
        </CardTitle>
        <CardDescription>Create a new IELTS reading test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Test Type</label>
          <RadioGroup
            value={testType}
            onValueChange={(v) => {
              setTestType(v as TestType);
              setTimeLimit(v === 'FULL_TEST' ? 60 : 20);
            }}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <RadioGroupItem value="FULL_TEST" id="full" />
              <label htmlFor="full" className="cursor-pointer flex-1">
                <div className="font-medium text-white">Full Test</div>
                <div className="text-sm text-slate-400">3 passages, ~40 questions, 60 minutes</div>
              </label>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <RadioGroupItem value="SINGLE_PASSAGE" id="single" />
              <label htmlFor="single" className="cursor-pointer flex-1">
                <div className="font-medium text-white">Single Passage Test</div>
                <div className="text-sm text-slate-400">1 passage, ~13 questions, 20 minutes</div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Title *</label>
          <Input
            placeholder="e.g., IELTS Reading Practice Test 1"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Description (optional)</label>
          <Textarea
            placeholder="Brief description of the test..."
            value={testDescription}
            onChange={(e) => setTestDescription(e.target.value)}
            rows={3}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Time Limit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Time Limit (minutes)</label>
          <Input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            min={1}
            max={180}
            className="bg-slate-800/50 border-slate-700 text-white w-32"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleCreateTest}
            disabled={!testTitle.trim() || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Test
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddPassageMethod = () => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-indigo-400" />
              Add Passage {addedPassageIds.length + 1}
              {testType === 'FULL_TEST' && <span className="text-slate-400 text-base font-normal">of 3</span>}
            </CardTitle>
            <CardDescription>Choose how to add a passage to your test</CardDescription>
          </div>
          {createdTest && (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              Test: {createdTest.title}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator for full tests */}
        {testType === 'FULL_TEST' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < addedPassageIds.length
                      ? 'bg-emerald-500'
                      : i === addedPassageIds.length
                      ? 'bg-indigo-500 animate-pulse'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-slate-400">
              {addedPassageIds.length} of 3 passages added
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upload Images Option */}
          <Card
            className="bg-slate-800/30 border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer group"
            onClick={() => setCurrentStep('upload-images')}
          >
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                  <ImageIcon className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Upload Images</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload images of the passage and let AI extract the content
                  </p>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Recommended
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry Option (placeholder) */}
          <Card className="bg-slate-800/30 border-slate-700 opacity-50 cursor-not-allowed">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
                  <PenLine className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-400">Enter Manually</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Type or paste the passage content manually
                  </p>
                </div>
                <Badge variant="outline" className="border-slate-600 text-slate-500">
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skip to complete if we have passages */}
        {addedPassageIds.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <span className="text-sm text-slate-400">
              {testType === 'FULL_TEST'
                ? 'Add more passages or finish the test'
                : 'Continue to finish the test'}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentStep('complete')}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Finish Test
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderUploadImages = () => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5 text-indigo-400" />
          Upload Passage Images
        </CardTitle>
        <CardDescription>
          Select images containing the reading passage and questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Input */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-300 font-medium">Click to upload images</p>
            <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
            <p className="text-xs text-slate-600 mt-2">PNG, JPG, JPEG up to 10MB each</p>
          </div>

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Selected Images ({selectedImages.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImages([])}
                  className="text-slate-400 hover:text-red-400"
                >
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedImages.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 text-xs text-slate-400 truncate">{file.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Extraction Hint */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Extraction Hint (optional)
          </label>
          <Textarea
            placeholder="e.g., This is a passage about climate change with True/False/Not Given questions..."
            value={extractionHint}
            onChange={(e) => setExtractionHint(e.target.value)}
            rows={2}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('add-passage-method')}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleStartExtraction}
            disabled={selectedImages.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Extract Content
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderExtracting = () => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          Extracting Content
        </CardTitle>
        <CardDescription>AI is analyzing your images...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-white">Processing your images...</p>
            <p className="text-sm text-slate-400">This may take 30-60 seconds</p>
          </div>

          <div className="w-full max-w-md">
            <Progress value={extractionProgress} className="h-2" />
            <p className="text-xs text-slate-500 mt-2 text-center">
              {Math.round(extractionProgress)}% complete
            </p>
          </div>

          <Alert className="max-w-md bg-slate-800/50 border-slate-700">
            <AlertDescription className="text-slate-300 text-sm">
              The AI is extracting:
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                <li>Passage title and content</li>
                <li>Question groups and instructions</li>
                <li>Individual questions with answers</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewEdit = () => {
    if (!editablePassage) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  Preview & Edit Passage
                </CardTitle>
                <CardDescription>
                  Review the extracted content and make any necessary corrections
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  <Hash className="h-3 w-3 mr-1" />
                  {editablePassage.content.split(/\s+/).length} words
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  <Star className="h-3 w-3 mr-1" />
                  Level {editablePassage.difficulty_level || 1}
                </Badge>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  <FileText className="h-3 w-3 mr-1" />
                  {editablePassage.questions.length} questions
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Extraction Notes */}
        {extractedData?.extraction_notes && extractedData.extraction_notes.length > 0 && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              <strong>Extraction Notes:</strong>
              <ul className="list-disc list-inside mt-1">
                {extractedData.extraction_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Passage Content */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-white">
                  {isEditingPassage ? (
                    <>
                      <PenLine className="h-5 w-5 text-indigo-400" />
                      Edit Passage
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 text-indigo-400" />
                      {editablePassage.title}
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Topic: {editablePassage.topic}
                  {editablePassage.source && ` • Source: ${editablePassage.source}`}
                </CardDescription>
              </div>
              {!isEditingPassage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEditPassage}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingPassage ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Title</label>
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Content</label>
                  <Textarea
                    value={tempContent}
                    onChange={(e) => setTempContent(e.target.value)}
                    rows={12}
                    className="bg-slate-800/50 border-slate-700 text-white font-serif text-[15px] leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelPassageEdit}
                    className="border-slate-600 text-slate-300"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePassageEdit} className="bg-indigo-600 hover:bg-indigo-500">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-300">
                  {editablePassage.content}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        {editablePassage.question_groups.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-indigo-400" />
                Questions ({editablePassage.questions.length})
              </CardTitle>
              <CardDescription>Review and edit the questions and answers</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion
                type="multiple"
                defaultValue={editablePassage.question_groups.map((g) => g.id)}
                className="w-full"
              >
                {editablePassage.question_groups
                  .sort((a, b) => a.start_question_number - b.start_question_number)
                  .map((group) => {
                    const questions = groupedQuestions.get(group.id) || [];
                    return (
                      <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="border-slate-700"
                      >
                        <AccordionTrigger className="hover:no-underline text-slate-200">
                          <div className="flex items-center gap-3 text-left">
                            <Badge className="bg-indigo-500/20 text-indigo-300 font-mono">
                              Q{group.start_question_number}-{group.end_question_number}
                            </Badge>
                            <span className="font-medium">
                              {questionTypeLabels[group.question_type] || group.question_type}
                            </span>
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              {questions.length} questions
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {/* Group Instructions */}
                            <Alert className="bg-slate-800/50 border-slate-700">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <AlertDescription className="text-slate-300 text-sm">
                                {group.group_instructions}
                              </AlertDescription>
                            </Alert>

                            {/* Shared Options for the Group */}
                            {group.options && group.options.length > 0 && (
                              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                <div className="text-sm font-medium text-indigo-300 mb-3">
                                  Shared Options for Questions {group.start_question_number}-{group.end_question_number}:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {group.options.map((option) => (
                                    <div
                                      key={option.label}
                                      className="text-sm px-3 py-2 rounded-md bg-slate-800/50 text-slate-300"
                                    >
                                      <span className="font-semibold text-indigo-400 mr-2">
                                        {option.label}:
                                      </span>
                                      {option.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Questions */}
                            <div className="space-y-3">
                              {questions.map((question) => (
                                <Card
                                  key={question.question_number}
                                  className="bg-slate-800/30 border-slate-700"
                                >
                                  <CardContent className="pt-4">
                                    {editingQuestionId === question.question_number ? (
                                      // Edit Mode
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-slate-700 text-slate-300 font-mono">
                                            Q{question.question_number}
                                          </Badge>
                                          <span className="text-xs text-slate-500">Editing</span>
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-300">
                                            Question Text
                                          </label>
                                          <Textarea
                                            value={tempQuestionText}
                                            onChange={(e) => setTempQuestionText(e.target.value)}
                                            rows={2}
                                            className="bg-slate-800/50 border-slate-600 text-white text-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-300">
                                            Correct Answer
                                          </label>
                                          <Input
                                            value={tempCorrectAnswer}
                                            onChange={(e) => setTempCorrectAnswer(e.target.value)}
                                            className="bg-slate-800/50 border-slate-600 text-white max-w-xs"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelQuestionEdit}
                                            className="border-slate-600 text-slate-300"
                                          >
                                            <X className="mr-1 h-3 w-3" />
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleSaveQuestionEdit(question.question_number)
                                            }
                                            className="bg-indigo-600 hover:bg-indigo-500"
                                          >
                                            <Check className="mr-1 h-3 w-3" />
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      // View Mode
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Badge className="bg-slate-700 text-slate-300 font-mono">
                                                Q{question.question_number}
                                              </Badge>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-300">
                                              {question.question_text}
                                            </p>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEditQuestion(question)}
                                            className="text-slate-400 hover:text-white"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        {/* Options - show question-level options if group doesn't have shared options */}
                                        {question.options && question.options.length > 0 && !(group.options && group.options.length > 0) && (
                                          <div className="pl-4 border-l-2 border-slate-700 space-y-1.5">
                                            {question.options.map((option) => (
                                              <div
                                                key={option.label}
                                                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                                                  option.label ===
                                                  getAnswerString(question.correct_answer)
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-slate-800/30 text-slate-400'
                                                }`}
                                              >
                                                <span className="font-medium mr-2">
                                                  {option.label}:
                                                </span>
                                                {option.text}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Correct Answer */}
                                        <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
                                          <span className="text-sm font-medium text-slate-400">
                                            Answer:
                                          </span>
                                          <Input
                                            value={getAnswerString(question.correct_answer)}
                                            onChange={(e) =>
                                              handleQuickAnswerUpdate(
                                                question.question_number,
                                                e.target.value
                                              )
                                            }
                                            className="bg-slate-800/50 border-slate-600 text-white max-w-[200px] h-8 text-sm"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedImages([]);
              setExtractedData(null);
              setEditablePassage(null);
              setCurrentStep('upload-images');
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Re-upload Images
          </Button>
          <Button
            onClick={handleAddPassageToTest}
            disabled={isSubmitting || isEditingPassage || editingQuestionId !== null}
            className="bg-emerald-600 hover:bg-emerald-500 min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Passage to Test
              </>
            )}
          </Button>
        </div>

        {/* Warning */}
        {(isEditingPassage || editingQuestionId !== null) && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              Please save or cancel your current edits before adding the passage.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderComplete = () => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">Test Created Successfully!</h3>
            <p className="text-slate-400">
              Your test "<strong className="text-white">{createdTest?.title}</strong>" is ready.
            </p>
          </div>

          {createdTest && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                <FileText className="h-3 w-3 mr-1" />
                {addedPassageIds.length} passage(s)
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                <Hash className="h-3 w-3 mr-1" />
                {createdTest.total_questions} questions
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                <Clock className="h-3 w-3 mr-1" />
                {createdTest.time_limit_minutes} minutes
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {createdTest.status}
              </Badge>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {testType === 'FULL_TEST' && addedPassageIds.length < 3 && (
              <Button
                variant="outline"
                onClick={handleAddAnotherPassage}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add More Passages
              </Button>
            )}
            <Button
              onClick={() => navigate('/admin')}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ==================== Main Render ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-xl font-semibold text-white">Create New Test</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Step Indicator */}
          {currentStep !== 'complete' && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <StepIndicator steps={STEPS} currentStep={currentStep} />
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === 'test-details' && renderTestDetails()}
          {currentStep === 'add-passage-method' && renderAddPassageMethod()}
          {currentStep === 'upload-images' && renderUploadImages()}
          {currentStep === 'extracting' && renderExtracting()}
          {currentStep === 'preview-edit' && renderPreviewEdit()}
          {currentStep === 'complete' && renderComplete()}
        </div>
      </main>
    </div>
  );
};

export default TestBuilder;
