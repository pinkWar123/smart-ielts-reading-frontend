import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ChevronLeft,
  Shield,
  Loader2,
  AlertCircle,
  Save,
  Edit2,
  Check,
  X,
  FileText,
  BookOpen,
  Sparkles,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react';
import {
  passagesApi,
  testsApi,
  type GetPassageDetailByIdResponse,
  type PassageDetailQuestionGroupDTO,
  type PassageDetailQuestionDTO,
  type UpdatePassageWithQuestionsRequest,
  type CreateCompletePassageRequest,
  type QuestionType,
  type QuestionOptionDTO,
  type AuthorInfo,
} from '@/lib/api/tests';

// Question type options
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE_NOTGIVEN', label: 'True/False/Not Given' },
  { value: 'YES_NO_NOTGIVEN', label: 'Yes/No/Not Given' },
  { value: 'MATCHING_HEADINGS', label: 'Matching Headings' },
  { value: 'MATCHING_INFORMATION', label: 'Matching Information' },
  { value: 'MATCHING_FEATURES', label: 'Matching Features' },
  { value: 'MATCHING_SENTENCE_ENDINGS', label: 'Matching Sentence Endings' },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion' },
  { value: 'NOTE_COMPLETION', label: 'Note Completion' },
  { value: 'TABLE_COMPLETION', label: 'Table Completion' },
  { value: 'FLOW_CHART_COMPLETION', label: 'Flow Chart Completion' },
  { value: 'DIAGRAM_LABEL_COMPLETION', label: 'Diagram Label Completion' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
];

// Internal types for editing state
interface EditableQuestion extends PassageDetailQuestionDTO {
  id: string; // Generate a temporary ID for editing
}

interface EditableQuestionGroup extends Omit<PassageDetailQuestionGroupDTO, 'questions'> {
  questions: EditableQuestion[];
}

interface EditablePassage {
  title: string;
  content: string;
  difficulty_level: number;
  topic: string;
  source: string | null;
  question_groups: EditableQuestionGroup[];
  created_by: AuthorInfo | null;
}

// Transform API response to editable format
const transformToEditable = (data: GetPassageDetailByIdResponse): EditablePassage => {
  return {
    title: data.title,
    content: data.content,
    difficulty_level: data.difficulty_level,
    topic: data.topic,
    source: data.source || null,
    created_by: data.created_by,
    question_groups: data.question_groups.map(group => ({
      ...group,
      questions: (group.questions || []).map((q, idx) => ({
        ...q,
        id: `${group.id}-q-${idx}`, // Generate temporary ID for editing
      })),
    })),
  };
};

// Get all questions flat from question groups
const getAllQuestions = (passage: EditablePassage): EditableQuestion[] => {
  return passage.question_groups
    .flatMap(g => g.questions)
    .sort((a, b) => a.question_number - b.question_number);
};

// Count total questions
const getTotalQuestionCount = (passage: EditablePassage): number => {
  return passage.question_groups.reduce((sum, g) => sum + g.questions.length, 0);
};

export const PassageEdit: React.FC = () => {
  const { testId, passageId } = useParams<{ testId: string; passageId: string }>();
  const navigate = useNavigate();

  // Check if we're creating a new passage
  const isNewPassage = passageId === 'new';

  const [passage, setPassage] = useState<EditablePassage | null>(null);
  const [isLoading, setIsLoading] = useState(!isNewPassage); // Don't show loading for new passage
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit states for passage content
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [editedDifficulty, setEditedDifficulty] = useState<number>(2);
  const [editedSource, setEditedSource] = useState('');

  // Question group editing
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedGroupInstructions, setEditedGroupInstructions] = useState('');
  const [editedGroupQuestionType, setEditedGroupQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [editedGroupOptions, setEditedGroupOptions] = useState<QuestionOptionDTO[]>([]);

  // Question editing - full fields
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<{
    question_text: string;
    question_type: QuestionType;
    correct_answer: string;
    acceptable_answers: string;
    explanation: string;
    instructions: string;
    points: number;
    options: QuestionOptionDTO[];
  }>({
    question_text: '',
    question_type: 'MULTIPLE_CHOICE',
    correct_answer: '',
    acceptable_answers: '',
    explanation: '',
    instructions: '',
    points: 1,
    options: [],
  });

  useEffect(() => {
    if (isNewPassage) {
      // Initialize empty passage for creation
      const emptyPassage: EditablePassage = {
        title: '',
        content: '',
        difficulty_level: 2,
        topic: '',
        source: null,
        question_groups: [],
        created_by: null,
      };
      setPassage(emptyPassage);
      initializeEditFields(emptyPassage);
      setIsEditingContent(true); // Start in edit mode for new passage
    } else if (passageId) {
      loadPassage();
    }
  }, [passageId, isNewPassage]);

  const loadPassage = async () => {
    if (!passageId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Fetch passage data from /passages/{passage_id}
      const data = await passagesApi.getPassageById(passageId);
      const editable = transformToEditable(data);
      setPassage(editable);
      initializeEditFields(editable);
    } catch (err) {
      console.error('Failed to load passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load passage');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeEditFields = (data: EditablePassage) => {
    setEditedTitle(data.title);
    setEditedContent(data.content);
    setEditedTopic(data.topic);
    setEditedDifficulty(data.difficulty_level);
    setEditedSource(data.source || '');
  };

  const handleSaveContent = () => {
    if (!passage) return;
    
    // Update locally immediately
      setPassage(prev => prev ? {
        ...prev,
        title: editedTitle,
        content: editedContent,
        topic: editedTopic,
        difficulty_level: editedDifficulty,
        source: editedSource || null,
      } : null);
      setIsEditingContent(false);
    setSuccessMessage('Passage content updated. Click "Save All Changes" to persist.');
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Save all passage data including questions using PUT /passages/{passage_id}
  const handleSaveAllWithQuestions = async () => {
    if (!passage || !passageId) return;

    const totalQuestions = getTotalQuestionCount(passage);
    
    // Validate question count (13-14 questions required)
    if (totalQuestions < 13 || totalQuestions > 14) {
      setError(`Passage must have 13-14 questions. Currently has ${totalQuestions} questions.`);
      return;
    }
    
    setIsSavingAll(true);
    setError(null);
    try {
      // Build the full update request matching the DTO structure
      // Note: options must ALWAYS be sent as an array (empty [] if no options)
      const updateRequest: UpdatePassageWithQuestionsRequest = {
        title: passage.title,
        content: passage.content,
        difficulty_level: passage.difficulty_level,
        topic: passage.topic,
        source: passage.source || null,
        question_groups: passage.question_groups.map(g => ({
          id: g.id,
          group_instructions: g.group_instructions,
          question_type: g.question_type as QuestionType,
          start_question_number: g.start_question_number,
          end_question_number: g.end_question_number,
          order_in_passage: g.order_in_passage,
          // Always send as array
          options: Array.isArray(g.options) ? g.options : [],
        })),
        questions: getAllQuestions(passage).map(q => ({
          question_number: q.question_number,
          question_type: q.question_type as QuestionType,
          question_text: q.question_text,
          // Always send as array
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer || { answer: '' },
          explanation: q.explanation || null,
          instructions: q.instructions || null,
          points: q.points,
          order_in_passage: q.order_in_passage,
          question_group_id: q.question_group_id || null,
        })),
      };

      await passagesApi.updatePassageWithQuestions(passageId, updateRequest);
      
      // Reload to get fresh data
      await loadPassage();
      
      setSuccessMessage('Passage and all questions saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save passage with questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to save passage with questions');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Create a new passage and add it to the test
  const handleCreatePassage = async () => {
    if (!passage || !testId) return;

    // Validate required fields
    if (!editedTitle.trim()) {
      setError('Please enter a title for the passage');
      return;
    }
    if (!editedContent.trim()) {
      setError('Please enter content for the passage');
      return;
    }
    if (!editedTopic.trim()) {
      setError('Please enter a topic for the passage');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      // Create the passage with minimal data (no questions yet)
      const createRequest: CreateCompletePassageRequest = {
        title: editedTitle,
        content: editedContent,
        difficulty_level: editedDifficulty,
        topic: editedTopic,
        source: editedSource || null,
        questions: [], // Start with no questions
      };

      const createdPassage = await passagesApi.createCompletePassage(createRequest);
      
      // Add the passage to the test
      await testsApi.addPassageToTest(testId, createdPassage.id);

      setSuccessMessage('Passage created and added to test successfully!');
      
      // Navigate to the edit page for the new passage
      navigate(`/admin/test/${testId}/passage/${createdPassage.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to create passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to create passage');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelEdit = () => {
    if (isNewPassage) {
      // For new passages, cancel navigates back to the test
      navigate(`/admin/test/${testId}`);
    } else {
      // For existing passages, reset to original values
      if (passage) {
        initializeEditFields(passage);
      }
      setIsEditingContent(false);
    }
  };

  // Question Group Editing
  const handleEditGroup = (group: EditableQuestionGroup) => {
    setEditingGroupId(group.id);
    setEditedGroupInstructions(group.group_instructions);
    setEditedGroupQuestionType(group.question_type as QuestionType);
    setEditedGroupOptions(group.options || []);
  };

  const handleSaveGroup = (groupId: string) => {
    if (!passage) return;
    
    setPassage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        question_groups: prev.question_groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                group_instructions: editedGroupInstructions,
                question_type: editedGroupQuestionType,
                options: editedGroupOptions.length > 0 ? editedGroupOptions : null,
              }
            : g
        ),
      };
    });
    setEditingGroupId(null);
    setSuccessMessage('Question group updated. Click "Save All Changes" to persist.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
    setEditedGroupInstructions('');
    setEditedGroupQuestionType('MULTIPLE_CHOICE');
    setEditedGroupOptions([]);
  };

  const handleAddGroupOption = () => {
    const nextLabel = String.fromCharCode(65 + editedGroupOptions.length); // A, B, C, ...
    setEditedGroupOptions([...editedGroupOptions, { label: nextLabel, text: '' }]);
  };

  const handleUpdateGroupOption = (index: number, field: 'label' | 'text', value: string) => {
    setEditedGroupOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    ));
  };

  const handleRemoveGroupOption = (index: number) => {
    setEditedGroupOptions(prev => prev.filter((_, i) => i !== index));
  };

  // Question Editing - Full fields
  const handleEditQuestion = (question: EditableQuestion, groupId: string) => {
    setEditingQuestionId(question.id);
    const answer = question.correct_answer?.answer;
    const acceptableAnswers = question.correct_answer?.acceptable_answers;
    
    setEditedQuestion({
      question_text: question.question_text,
      question_type: question.question_type as QuestionType,
      correct_answer: typeof answer === 'string' ? answer : Array.isArray(answer) ? answer.join(', ') : JSON.stringify(answer || ''),
      acceptable_answers: Array.isArray(acceptableAnswers) ? acceptableAnswers.join(', ') : '',
      explanation: question.explanation || '',
      instructions: question.instructions || '',
      points: question.points,
      options: question.options || [],
    });
  };

  const handleSaveQuestion = (questionId: string, groupId: string) => {
    if (!passage) return;
    
    // Parse correct answer
    let correctAnswer: Record<string, unknown> = { answer: editedQuestion.correct_answer };
    
    // Add acceptable answers if provided
    if (editedQuestion.acceptable_answers.trim()) {
      correctAnswer.acceptable_answers = editedQuestion.acceptable_answers.split(',').map(a => a.trim());
    }

      setPassage(prev => {
        if (!prev) return null;
        return {
          ...prev,
        question_groups: prev.question_groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                questions: g.questions.map(q =>
            q.id === questionId
                    ? {
                        ...q,
                        question_text: editedQuestion.question_text,
                        question_type: editedQuestion.question_type,
                        correct_answer: correctAnswer as PassageDetailQuestionDTO['correct_answer'],
                        explanation: editedQuestion.explanation || null,
                        instructions: editedQuestion.instructions || null,
                        points: editedQuestion.points,
                        options: editedQuestion.options.length > 0 ? editedQuestion.options : null,
                      }
                    : q
                ),
              }
            : g
          ),
        };
      });
      setEditingQuestionId(null);
    setSuccessMessage('Question updated. Click "Save All Changes" to persist.');
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setEditedQuestion({
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      correct_answer: '',
      acceptable_answers: '',
      explanation: '',
      instructions: '',
      points: 1,
      options: [],
    });
  };

  const handleAddQuestionOption = () => {
    const nextLabel = String.fromCharCode(65 + editedQuestion.options.length);
    setEditedQuestion(prev => ({
      ...prev,
      options: [...prev.options, { label: nextLabel, text: '' }],
    }));
  };

  const handleUpdateQuestionOption = (index: number, field: 'label' | 'text', value: string) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const handleRemoveQuestionOption = (index: number) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      case 4: return 'Expert';
      case 5: return 'Very Hard';
      default: return 'Unknown';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const found = QUESTION_TYPES.find(t => t.value === type);
    return found?.label || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
          <p className="text-slate-400">Loading passage...</p>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          <Link to={`/admin/test/${testId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8">
            <ChevronLeft className="h-4 w-4" />
            Back to Test
          </Link>
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error || 'Passage not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const totalQuestions = getTotalQuestionCount(passage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IE</span>
                </div>
                <span className="font-semibold text-white">IELTS Practice</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Link */}
        <Link 
          to={`/admin/test/${testId}`} 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Test
        </Link>

        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Passage Content Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {isNewPassage ? 'Create New Passage' : 'Passage Content'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isNewPassage 
                    ? 'Enter the passage details to create a new passage for this test'
                    : isEditingContent 
                      ? 'Edit the passage details' 
                      : 'View and edit passage content'}
                </CardDescription>
              </div>
              {!isEditingContent && !isNewPassage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingContent(true)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditingContent ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Title</label>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Passage title..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Topic</label>
                    <Input
                      value={editedTopic}
                      onChange={(e) => setEditedTopic(e.target.value)}
                      placeholder="e.g., Science, History..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Difficulty (1-5)</label>
                    <Select
                      value={editedDifficulty.toString()}
                      onValueChange={(value) => setEditedDifficulty(parseInt(value))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Easy</SelectItem>
                        <SelectItem value="2">2 - Medium</SelectItem>
                        <SelectItem value="3">3 - Hard</SelectItem>
                        <SelectItem value="4">4 - Expert</SelectItem>
                        <SelectItem value="5">5 - Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Source (optional)</label>
                    <Input
                      value={editedSource}
                      onChange={(e) => setEditedSource(e.target.value)}
                      placeholder="e.g., Cambridge IELTS 15..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Content</label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={15}
                    className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                    placeholder="Passage content..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-slate-700 text-slate-300"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveContent}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Changes
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-semibold text-white">{passage.title}</h3>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    {getDifficultyLabel(passage.difficulty_level)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {passage.topic}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {passage.content.split(/\s+/).length} words
                  </span>
                  {passage.source && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {passage.source}
                    </span>
                  )}
                  {passage.created_by && (
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">Created by:</span>
                      <span className="text-indigo-300">{passage.created_by.full_name}</span>
                    </span>
                  )}
                </div>

                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 max-h-96 overflow-y-auto">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {passage.content}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Questions Section - Only show for existing passages */}
        {!isNewPassage && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Questions ({totalQuestions})
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Edit question groups and individual questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {passage.question_groups.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400">No questions added yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Questions will appear here after extraction or manual addition
                  </p>
                </div>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-3">
                {passage.question_groups
                  .sort((a, b) => a.order_in_passage - b.order_in_passage)
                  .map((group) => (
                  <AccordionItem 
                    key={group.id} 
                    value={group.id}
                    className="border border-slate-700 rounded-lg bg-slate-800/20 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-slate-800/30 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
                          Q{group.start_question_number}-{group.end_question_number}
                        </Badge>
                        <span className="font-medium text-sm text-white">
                          {getQuestionTypeLabel(group.question_type)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({group.questions.length} questions)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Group Editing */}
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          {editingGroupId === group.id ? (
                            // Group Edit Mode
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Settings className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm font-medium text-white">Edit Question Group</span>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Question Type</label>
                                <Select
                                  value={editedGroupQuestionType}
                                  onValueChange={(value) => setEditedGroupQuestionType(value as QuestionType)}
                                >
                                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {QUESTION_TYPES.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Group Instructions</label>
                                <Textarea
                                  value={editedGroupInstructions}
                                  onChange={(e) => setEditedGroupInstructions(e.target.value)}
                                  rows={3}
                                  className="bg-slate-900 border-slate-600 text-white text-sm"
                                  placeholder="Instructions for this question group..."
                                />
                              </div>

                              {/* Group Options for matching questions */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-slate-300">Shared Options (for matching questions)</label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddGroupOption}
                                    className="border-slate-600 text-slate-300 h-7"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                                {editedGroupOptions.length > 0 ? (
                                  <div className="space-y-2">
                                    {editedGroupOptions.map((option, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <Input
                                          value={option.label}
                                          onChange={(e) => handleUpdateGroupOption(idx, 'label', e.target.value)}
                                          className="bg-slate-900 border-slate-600 text-white w-16"
                                          placeholder="A"
                                        />
                                        <Input
                                          value={option.text}
                                          onChange={(e) => handleUpdateGroupOption(idx, 'text', e.target.value)}
                                          className="bg-slate-900 border-slate-600 text-white flex-1"
                                          placeholder="Option text..."
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveGroupOption(idx)}
                                          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">No options. Click "Add" to add shared options for matching questions.</p>
                                )}
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelGroupEdit}
                                  className="border-slate-600 text-slate-300"
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveGroup(group.id)}
                                  className="bg-indigo-600 hover:bg-indigo-500"
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Apply
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Group View Mode
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-300">Group Settings</span>
                                  </div>
                                  <p className="text-sm text-slate-300">{group.group_instructions}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditGroup(group)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Show group options */}
                              {group.options && group.options.length > 0 && (
                                <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                                  <p className="text-xs font-medium text-slate-400 mb-2">Shared Options:</p>
                                  <div className="grid grid-cols-2 gap-1">
                              {group.options.map((option) => (
                                      <div key={option.label} className="text-xs">
                                        <span className="font-medium text-indigo-400">{option.label}.</span>{' '}
                                        <span className="text-slate-300">{option.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                            </div>
                          )}
                        </div>

                        {/* Questions */}
                        <div className="space-y-3">
                          {group.questions
                            .sort((a, b) => a.question_number - b.question_number)
                            .map((question) => (
                            <Card key={question.id} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="pt-4">
                                {editingQuestionId === question.id ? (
                                  // Question Edit Mode - Full Fields
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                        Q{question.question_number}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Question Type</label>
                                        <Select
                                          value={editedQuestion.question_type}
                                          onValueChange={(value) => setEditedQuestion(prev => ({ ...prev, question_type: value as QuestionType }))}
                                        >
                                          <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {QUESTION_TYPES.map(type => (
                                              <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Points</label>
                                        <Input
                                          type="number"
                                          min={1}
                                          value={editedQuestion.points}
                                          onChange={(e) => setEditedQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                          className="bg-slate-900 border-slate-600 text-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-300">Question Text</label>
                                      <Textarea
                                        value={editedQuestion.question_text}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                                        rows={2}
                                        className="bg-slate-900 border-slate-600 text-white text-sm"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-300">Instructions (optional)</label>
                                      <Input
                                        value={editedQuestion.instructions}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, instructions: e.target.value }))}
                                        className="bg-slate-900 border-slate-600 text-white"
                                        placeholder="Individual question instructions..."
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Correct Answer</label>
                                        <Input
                                          value={editedQuestion.correct_answer}
                                          onChange={(e) => setEditedQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                                          className="bg-slate-900 border-slate-600 text-white"
                                          placeholder="e.g., A, TRUE, answer text..."
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Acceptable Answers (comma separated)</label>
                                        <Input
                                          value={editedQuestion.acceptable_answers}
                                          onChange={(e) => setEditedQuestion(prev => ({ ...prev, acceptable_answers: e.target.value }))}
                                          className="bg-slate-900 border-slate-600 text-white"
                                          placeholder="e.g., alternate1, alternate2..."
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-300">Explanation (optional)</label>
                                      <Textarea
                                        value={editedQuestion.explanation}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                        rows={2}
                                        className="bg-slate-900 border-slate-600 text-white text-sm"
                                        placeholder="Explanation for the correct answer..."
                                      />
                                    </div>

                                    {/* Question-specific options */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-300">Options (for multiple choice)</label>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleAddQuestionOption}
                                          className="border-slate-600 text-slate-300 h-7"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add
                                        </Button>
                                      </div>
                                      {editedQuestion.options.length > 0 ? (
                                        <div className="space-y-2">
                                          {editedQuestion.options.map((option, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <Input
                                                value={option.label}
                                                onChange={(e) => handleUpdateQuestionOption(idx, 'label', e.target.value)}
                                                className="bg-slate-900 border-slate-600 text-white w-16"
                                                placeholder="A"
                                              />
                                              <Input
                                                value={option.text}
                                                onChange={(e) => handleUpdateQuestionOption(idx, 'text', e.target.value)}
                                                className="bg-slate-900 border-slate-600 text-white flex-1"
                                                placeholder="Option text..."
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveQuestionOption(idx)}
                                                className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-500">No options. Options are used for multiple choice questions.</p>
                                      )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
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
                                        onClick={() => handleSaveQuestion(question.id, group.id)}
                                        className="bg-indigo-600 hover:bg-indigo-500"
                                      >
                                        <Check className="mr-1 h-3 w-3" />
                                        Apply
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  // Question View Mode
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                            Q{question.question_number}
                                          </Badge>
                                          <span className="text-xs text-slate-500">
                                            {getQuestionTypeLabel(question.question_type)}
                                          </span>
                                          <span className="text-xs text-slate-500">
                                            • {question.points} pt
                                          </span>
                                        </div>
                                        <p className="text-sm text-slate-300">{question.question_text}</p>
                                        
                                        {question.instructions && (
                                          <p className="text-xs text-slate-500 mt-1 italic">
                                            {question.instructions}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditQuestion(question, group.id)}
                                        className="text-slate-400 hover:text-white"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    {/* Show options for questions with options */}
                                    {question.options && question.options.length > 0 && (
                                      <div className="ml-8 mt-2 space-y-1">
                                        {question.options.map((option) => {
                                          const correctAnswer = question.correct_answer?.answer;
                                          const isCorrect = option.label === correctAnswer;
                                          return (
                                            <div
                                              key={option.label}
                                              className={`text-sm p-2 rounded ${
                                                isCorrect
                                                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                                                  : 'bg-slate-800/30'
                                              }`}
                                            >
                                              <span className={`font-medium ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {option.label}:
                                              </span>{' '}
                                              <span className="text-slate-300">{option.text}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="ml-8 flex flex-wrap items-center gap-2 mt-2">
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                        ✓ {typeof question.correct_answer?.answer === 'object' 
                                            ? JSON.stringify(question.correct_answer.answer)
                                            : question.correct_answer?.answer || 'N/A'}
                                      </Badge>
                                      {question.correct_answer?.acceptable_answers && 
                                       Array.isArray(question.correct_answer.acceptable_answers) && 
                                       question.correct_answer.acceptable_answers.length > 0 && (
                                      <span className="text-xs text-slate-500">
                                          (also: {question.correct_answer.acceptable_answers.join(', ')})
                                      </span>
                                      )}
                                    </div>

                                    {question.explanation && (
                                      <div className="ml-8 mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400">
                                        <span className="font-medium">Explanation:</span> {question.explanation}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
        )}

        {/* Save All Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {isNewPassage ? (
                  <>
                    <p className="text-sm text-white font-medium">
                      Create Passage
                    </p>
                    <p className="text-sm text-slate-400">
                      Creates the passage and adds it to the current test. You can add questions later.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white font-medium">
                      Save All Changes
                    </p>
                    <p className="text-sm text-slate-400">
                      Saves passage content, question groups, and all questions to the server (requires 13-14 questions)
                    </p>
                    {(totalQuestions < 13 || totalQuestions > 14) && (
                      <p className="text-sm text-amber-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Currently {totalQuestions} questions (need 13-14)
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/test/${testId}`)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {isNewPassage ? 'Cancel' : 'Back to Test'}
                </Button>
                {isNewPassage ? (
                  <Button
                    onClick={handleCreatePassage}
                    disabled={isCreating || !editedTitle.trim() || !editedContent.trim() || !editedTopic.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Passage
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveAllWithQuestions}
                    disabled={isSavingAll || totalQuestions < 13 || totalQuestions > 14}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isSavingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PassageEdit;
