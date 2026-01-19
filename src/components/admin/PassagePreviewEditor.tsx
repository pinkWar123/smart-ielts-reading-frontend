import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Edit2,
  Check,
  X,
  FileText,
  BookOpen,
  Hash,
  Star,
  Clock,
  Send,
  Eye,
  PenLine,
} from 'lucide-react';
import type {
  APIPassage,
  APIQuestion,
  APIQuestionGroup,
  EditablePassageData,
  EditableQuestion,
} from '@/lib/types/api';
import {
  apiPassageToEditable,
  isSelectQuestionType,
  getSelectOptions,
  APIQuestionType,
} from '@/lib/types/api';

interface PassagePreviewEditorProps {
  passage: APIPassage;
  onSubmit: (data: EditablePassageData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// Question type display names
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
  DIAGRAM_LABELING: 'Diagram Labeling',
  TABLE_COMPLETION: 'Table Completion',
  FLOW_CHART: 'Flow Chart',
};

export const PassagePreviewEditor: React.FC<PassagePreviewEditorProps> = ({
  passage,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Edit mode states
  const [isEditingPassage, setIsEditingPassage] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Editable data
  const [editableData, setEditableData] = useState<EditablePassageData>(() =>
    apiPassageToEditable(passage)
  );

  // Temporary edit states
  const [tempPassageTitle, setTempPassageTitle] = useState(editableData.title);
  const [tempPassageContent, setTempPassageContent] = useState(editableData.content);
  const [tempQuestionText, setTempQuestionText] = useState('');
  const [tempCorrectAnswer, setTempCorrectAnswer] = useState('');

  // Group questions by their question_group_id
  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, EditableQuestion[]>();
    editableData.questions.forEach(q => {
      const existing = groups.get(q.question_group_id) || [];
      groups.set(q.question_group_id, [...existing, q].sort((a, b) => a.question_number - b.question_number));
    });
    return groups;
  }, [editableData.questions]);

  // Total questions count
  const totalQuestions = editableData.questions.length;

  // Handle passage edit save
  const handleSavePassage = useCallback(() => {
    setEditableData(prev => ({
      ...prev,
      title: tempPassageTitle,
      content: tempPassageContent,
    }));
    setIsEditingPassage(false);
  }, [tempPassageTitle, tempPassageContent]);

  // Handle passage edit cancel
  const handleCancelPassageEdit = useCallback(() => {
    setTempPassageTitle(editableData.title);
    setTempPassageContent(editableData.content);
    setIsEditingPassage(false);
  }, [editableData.title, editableData.content]);

  // Start editing a question
  const handleEditQuestion = useCallback((question: EditableQuestion) => {
    setEditingQuestionId(question.id);
    setTempQuestionText(question.question_text);
    setTempCorrectAnswer(question.correct_answer);
  }, []);

  // Save question edit
  const handleSaveQuestion = useCallback((questionId: string) => {
    setEditableData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? { ...q, question_text: tempQuestionText, correct_answer: tempCorrectAnswer }
          : q
      ),
    }));
    setEditingQuestionId(null);
    setTempQuestionText('');
    setTempCorrectAnswer('');
  }, [tempQuestionText, tempCorrectAnswer]);

  // Cancel question edit
  const handleCancelQuestionEdit = useCallback(() => {
    setEditingQuestionId(null);
    setTempQuestionText('');
    setTempCorrectAnswer('');
  }, []);

  // Update correct answer directly (for quick edits)
  const handleQuickAnswerUpdate = useCallback((questionId: string, newAnswer: string) => {
    setEditableData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, correct_answer: newAnswer } : q
      ),
    }));
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    await onSubmit(editableData);
  };

  // Render correct answer input based on question type
  const renderAnswerInput = (question: EditableQuestion, isEditing: boolean) => {
    const value = isEditing ? tempCorrectAnswer : question.correct_answer;
    const onChange = isEditing
      ? (val: string) => setTempCorrectAnswer(val)
      : (val: string) => handleQuickAnswerUpdate(question.id, val);

    if (isSelectQuestionType(question.question_type)) {
      const options = question.options || getSelectOptions(question.question_type);
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full max-w-[200px]">
            <SelectValue placeholder="Select answer" />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.label} value={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Text input for completion types
    return (
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter correct answer..."
        className="max-w-[300px]"
      />
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Passage Preview</h2>
          <p className="text-muted-foreground">
            Review and edit the passage content before adding to the test
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Hash className="h-3 w-3" />
            {passage.word_count} words
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3" />
            Level {passage.difficulty_level}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {totalQuestions} questions
          </Badge>
        </div>
      </div>

      {/* Passage Metadata */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Passage Information
              </CardTitle>
              <CardDescription>
                Topic: {passage.topic} • Source: {passage.source}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Passage Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isEditingPassage ? (
                  <>
                    <PenLine className="h-5 w-5" />
                    Edit Passage
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    {editableData.title}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isEditingPassage
                  ? 'Edit the passage title and content'
                  : 'Click edit to modify the passage text'}
              </CardDescription>
            </div>
            {!isEditingPassage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPassage(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Passage
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingPassage ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={tempPassageTitle}
                  onChange={e => setTempPassageTitle(e.target.value)}
                  placeholder="Passage title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={tempPassageContent}
                  onChange={e => setTempPassageContent(e.target.value)}
                  rows={12}
                  className="font-serif text-[15px] leading-relaxed"
                  placeholder="Passage content..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelPassageEdit}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSavePassage} disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                {editableData.content}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Groups */}
      {editableData.question_groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Questions ({totalQuestions})
            </CardTitle>
            <CardDescription>
              Review and edit the questions and correct answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full" defaultValue={editableData.question_groups.map(g => g.id)}>
              {editableData.question_groups
                .sort((a, b) => a.start_question_number - b.start_question_number)
                .map(group => {
                  const questions = groupedQuestions.get(group.id) || [];
                  return (
                    <AccordionItem key={group.id} value={group.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="default" className="font-mono">
                            Q{group.start_question_number}-{group.end_question_number}
                          </Badge>
                          <span className="font-medium">
                            {questionTypeLabels[group.question_type] || group.question_type}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {questions.length} questions
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {/* Group Instructions */}
                          <Alert className="bg-muted/50">
                            <FileText className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {group.group_instructions}
                            </AlertDescription>
                          </Alert>

                          {/* Questions */}
                          <div className="space-y-3">
                            {questions.map(question => (
                              <Card key={question.id} className="bg-card/50 border shadow-sm">
                                <CardContent className="pt-4">
                                  {editingQuestionId === question.id ? (
                                    // Edit Mode
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono">
                                          Q{question.question_number}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Editing question
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                          Question Text
                                        </label>
                                        <Textarea
                                          value={tempQuestionText}
                                          onChange={e => setTempQuestionText(e.target.value)}
                                          rows={2}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                          Correct Answer
                                        </label>
                                        {renderAnswerInput(
                                          { ...question, correct_answer: tempCorrectAnswer },
                                          true
                                        )}
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelQuestionEdit}
                                        >
                                          <X className="mr-1 h-3 w-3" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveQuestion(question.id)}
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
                                            <Badge variant="secondary" className="font-mono">
                                              Q{question.question_number}
                                            </Badge>
                                          </div>
                                          <p className="text-sm leading-relaxed">
                                            {question.question_text}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="shrink-0"
                                          onClick={() => handleEditQuestion(question)}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                      </div>

                                      {/* Show options for questions with predefined options */}
                                      {question.options && question.options.length > 0 && (
                                        <div className="pl-4 border-l-2 border-muted space-y-1.5">
                                          {question.options.map(option => (
                                            <div
                                              key={option.label}
                                              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                                                option.label === question.correct_answer
                                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 font-medium'
                                                  : 'bg-muted/30'
                                              }`}
                                            >
                                              <span className="font-medium mr-2">{option.label}:</span>
                                              <span className="text-muted-foreground">{option.text}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Correct Answer Display/Edit */}
                                      <div className="flex items-center gap-3 pt-2 border-t">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          Correct Answer:
                                        </span>
                                        {renderAnswerInput(question, false)}
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isEditingPassage || editingQuestionId !== null}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Adding to Test...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Add Passage to Test
            </>
          )}
        </Button>
      </div>

      {/* Warning if editing */}
      {(isEditingPassage || editingQuestionId !== null) && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Please save or cancel your current edits before submitting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PassagePreviewEditor;

