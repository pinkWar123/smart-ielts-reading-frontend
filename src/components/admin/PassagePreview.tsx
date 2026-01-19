import React, { useState } from 'react';
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
import { Save, Edit2, Check, X, FileText } from 'lucide-react';
import type { ExtendedPassage } from '@/lib/types/passage';
import type { Question, QuestionOption } from '@/lib/types/question';
import useAdminStore from '@/lib/stores/adminStore';

interface PassagePreviewProps {
  passage: ExtendedPassage;
  onFinalize: () => void;
}

export const PassagePreview: React.FC<PassagePreviewProps> = ({ passage, onFinalize }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(passage.title);
  const [editedContent, setEditedContent] = useState(passage.content);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [editedCorrectAnswer, setEditedCorrectAnswer] = useState('');

  const { updatePassageContent, updateQuestion, isLoading } = useAdminStore();

  const handleSavePassage = async () => {
    try {
      await updatePassageContent(passage.id, {
        title: editedTitle,
        content: editedContent,
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save passage:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(passage.title);
    setEditedContent(passage.content);
    setIsEditMode(false);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestionText(question.text);
    setEditedCorrectAnswer(question.correctAnswer);
  };

  const handleSaveQuestion = async (questionId: string) => {
    try {
      await updateQuestion(passage.id, questionId, {
        text: editedQuestionText,
        correctAnswer: editedCorrectAnswer,
      });
      setEditingQuestionId(null);
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setEditedQuestionText('');
    setEditedCorrectAnswer('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Passage Preview</h2>
          <p className="text-muted-foreground">Review and edit the extracted content</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={passage.status === 'ready' ? 'default' : 'secondary'}>
            {passage.status}
          </Badge>
          {passage.wordCount && (
            <Badge variant="outline">{passage.wordCount} words</Badge>
          )}
        </div>
      </div>

      {/* Passage Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Passage Content</CardTitle>
              <CardDescription>
                {isEditMode ? 'Edit the passage title and content' : 'Extracted passage text'}
              </CardDescription>
            </div>
            {!isEditMode && (
              <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditMode ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Passage title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Passage content..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSavePassage} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-2">{passage.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {passage.content}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Question Groups */}
      {passage.questionGroups && passage.questionGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions ({passage.totalQuestions})</CardTitle>
            <CardDescription>
              Review and edit extracted questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {passage.questionGroups.map((group, groupIndex) => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        Questions {group.startNumber}-{group.endNumber}
                      </Badge>
                      <span className="font-medium">{group.type}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Group Instructions */}
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {group.instructions}
                        </AlertDescription>
                      </Alert>

                      {/* Questions */}
                      <div className="space-y-3">
                        {group.questions.map((question) => (
                          <Card key={question.id} className="bg-muted/50">
                            <CardContent className="pt-6">
                              {editingQuestionId === question.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Question {question.questionNumber}
                                    </label>
                                    <Textarea
                                      value={editedQuestionText}
                                      onChange={(e) => setEditedQuestionText(e.target.value)}
                                      rows={3}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Correct Answer
                                    </label>
                                    <Input
                                      value={editedCorrectAnswer}
                                      onChange={(e) => setEditedCorrectAnswer(e.target.value)}
                                      placeholder="Enter correct answer..."
                                    />
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
                                      disabled={isLoading}
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary">Q{question.questionNumber}</Badge>
                                        <span className="text-sm font-medium text-muted-foreground">
                                          {question.type}
                                        </span>
                                      </div>
                                      <p className="text-sm">{question.text}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditQuestion(question)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Show options for multiple choice questions */}
                                  {(question as any).options && (
                                    <div className="ml-8 mt-2 space-y-1">
                                      {((question as any).options as QuestionOption[]).map((option: QuestionOption) => (
                                        <div
                                          key={option.label}
                                          className={`text-sm p-2 rounded ${
                                            option.label === question.correctAnswer
                                              ? 'bg-green-100 dark:bg-green-900/20'
                                              : ''
                                          }`}
                                        >
                                          <span className="font-medium">{option.label}:</span> {option.text}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="ml-8 flex items-center gap-2 mt-2">
                                    <Badge variant="default" className="text-xs">
                                      ✓ {question.correctAnswer}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Correct Answer
                                    </span>
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
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Finalize Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        <Button
          onClick={onFinalize}
          disabled={isLoading || passage.status === 'finalized'}
          size="lg"
        >
          <Check className="mr-2 h-4 w-4" />
          {passage.status === 'finalized' ? 'Finalized' : 'Finalize Passage'}
        </Button>
      </div>
    </div>
  );
};
