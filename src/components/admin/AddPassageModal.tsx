import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Library,
  ImagePlus,
  Loader2,
  FileText,
  Check,
  Plus,
  Upload,
  FileImage,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  passagesApi,
  testsApi,
  type PassageResponse,
  type CreateCompletePassageRequest,
  type QuestionDTO,
  type PaginationMeta,
} from '@/lib/api/tests';
import useAdminStore from '@/lib/stores/adminStore';

interface AddPassageModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  existingPassageIds: string[];
  onPassageAdded: () => void;
}

type CreateStep = 'title' | 'upload' | 'extract' | 'processing' | 'preview';

const CREATE_STEPS: { id: CreateStep; label: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'upload', label: 'Upload' },
  { id: 'extract', label: 'Extract' },
  { id: 'processing', label: 'Processing' },
  { id: 'preview', label: 'Preview' },
];

export const AddPassageModal: React.FC<AddPassageModalProps> = ({
  isOpen,
  onClose,
  testId,
  existingPassageIds,
  onPassageAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'create'>('existing');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Existing passage state
  const [passages, setPassages] = useState<PassageResponse[]>([]);
  const [isLoadingPassages, setIsLoadingPassages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [isAddingPassage, setIsAddingPassage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create new passage state
  const [createStep, setCreateStep] = useState<CreateStep>('title');
  const [title, setTitle] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const {
    currentExtendedPassage,
    extractionStatus,
    extractionError,
    isLoading: isCreating,
    createEmptyPassage,
    uploadPassageImages,
    triggerExtraction,
    resetPassageWorkflow,
  } = useAdminStore();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load passages when modal opens or search query changes
  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      loadPassages(1, true);
    }
  }, [isOpen, activeTab, debouncedSearchQuery, existingPassageIds]);

  // Timer for extraction progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (extractionStatus === 'processing') {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [extractionStatus]);

  // Auto-advance to preview when extraction completes
  useEffect(() => {
    if (extractionStatus === 'completed' && createStep === 'processing') {
      setCreateStep('preview');
    }
  }, [extractionStatus, createStep]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPassageId(null);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setPassages([]);
      setPaginationMeta(null);
      setError(null);
      setSuccessMessage(null);
      setActiveTab('existing');
      resetCreateState();
    }
  }, [isOpen]);

  const resetCreateState = () => {
    setCreateStep('title');
    setTitle('');
    setSelectedImages([]);
    setElapsedTime(0);
    setIsFinalizing(false);
    resetPassageWorkflow();
  };

  const loadPassages = async (page: number = 1, reset: boolean = false) => {
    if (reset) {
      setIsLoadingPassages(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    
    try {
      const response = await passagesApi.getPaginatedPassages({
        page,
        page_size: 10,
        exclude_passage_ids: existingPassageIds,
        search: debouncedSearchQuery || undefined,
      });
      
      if (reset) {
        setPassages(response.data);
      } else {
        setPassages((prev) => [...prev, ...response.data]);
      }
      setPaginationMeta(response.meta);
    } catch (err) {
      console.error('Failed to load passages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load passages');
    } finally {
      setIsLoadingPassages(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (paginationMeta && paginationMeta.has_next) {
      loadPassages(paginationMeta.page + 1, false);
    }
  };

  const handleAddExistingPassage = async () => {
    if (!selectedPassageId) return;

    setIsAddingPassage(true);
    setError(null);
    try {
      await testsApi.addPassageToTest(testId, selectedPassageId);
      setSuccessMessage('Passage added to test successfully!');
      setTimeout(() => {
        onPassageAdded();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to add passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to add passage to test');
    } finally {
      setIsAddingPassage(false);
    }
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

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 2: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 3: return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 4: return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 5: return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  // Create passage handlers
  const handleCreatePassage = async () => {
    if (!title.trim()) {
      setError('Please enter a passage title');
      return;
    }

    setError(null);
    try {
      await createEmptyPassage(title);
      setCreateStep('upload');
    } catch (err) {
      console.error('Failed to create passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to create passage');
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadImages = async () => {
    if (!currentExtendedPassage || selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setError(null);
    try {
      await uploadPassageImages(currentExtendedPassage.id, selectedImages);
      setCreateStep('extract');
    } catch (err) {
      console.error('Failed to upload images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    }
  };

  const handleTriggerExtraction = async () => {
    if (!currentExtendedPassage) return;

    setError(null);
    try {
      setCreateStep('processing');
      await triggerExtraction(currentExtendedPassage.id);
    } catch (err) {
      console.error('Failed to trigger extraction:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger extraction');
      setCreateStep('extract');
    }
  };

  // Convert ExtendedPassage to backend API format and create real passage
  const handleFinalizeAndAdd = async () => {
    if (!currentExtendedPassage) return;

    setError(null);
    setIsFinalizing(true);
    try {
      // Convert the mock ExtendedPassage to the real backend API format
      const questions: QuestionDTO[] = [];
      let questionOrder = 0;
      
      currentExtendedPassage.questionGroups?.forEach((group) => {
        group.questions.forEach((q) => {
          questions.push({
            question_number: q.questionNumber,
            question_type: mapQuestionType(q.type),
            question_text: q.text,
            options: (q as any).options || null,
            correct_answer: { answer: q.correctAnswer },
            explanation: null,
            instructions: group.instructions || null,
            points: 1,
            order_in_passage: questionOrder++,
            question_group_id: null,
          });
        });
      });

      const createRequest: CreateCompletePassageRequest = {
        title: currentExtendedPassage.title,
        content: currentExtendedPassage.content || '',
        difficulty_level: 2, // Default to medium
        topic: 'General', // Default topic
        source: null,
        questions: questions,
      };

      // Create the real passage in the backend
      const createdPassage = await passagesApi.createCompletePassage(createRequest);
      
      // Add the newly created passage to the test
      await testsApi.addPassageToTest(testId, createdPassage.id);
      
      setSuccessMessage('Passage created and added to test successfully!');
      setTimeout(() => {
        onPassageAdded();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to finalize passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to finalize passage');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Map question types from the mock format to the backend API format
  const mapQuestionType = (type: string): 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOTGIVEN' | 'YES_NO_NOTGIVEN' | 'MATCHING_HEADINGS' | 'MATCHING_INFORMATION' | 'MATCHING_FEATURES' | 'MATCHING_SENTENCE_ENDINGS' | 'SENTENCE_COMPLETION' | 'SUMMARY_COMPLETION' | 'NOTE_COMPLETION' | 'TABLE_COMPLETION' | 'FLOW_CHART_COMPLETION' | 'DIAGRAM_LABEL_COMPLETION' | 'SHORT_ANSWER' => {
    const typeMap: Record<string, any> = {
      'Multiple Choice': 'MULTIPLE_CHOICE',
      'True/False/Not Given': 'TRUE_FALSE_NOTGIVEN',
      'Yes/No/Not Given': 'YES_NO_NOTGIVEN',
      'Matching Headings': 'MATCHING_HEADINGS',
      'Matching Information': 'MATCHING_INFORMATION',
      'Matching Features': 'MATCHING_FEATURES',
      'Matching Sentence Endings': 'MATCHING_SENTENCE_ENDINGS',
      'Sentence Completion': 'SENTENCE_COMPLETION',
      'Summary Completion': 'SUMMARY_COMPLETION',
      'Note Completion': 'NOTE_COMPLETION',
      'Table Completion': 'TABLE_COMPLETION',
      'Flow Chart Completion': 'FLOW_CHART_COMPLETION',
      'Diagram Label Completion': 'DIAGRAM_LABEL_COMPLETION',
      'Short Answer': 'SHORT_ANSWER',
    };
    return typeMap[type] || 'SHORT_ANSWER';
  };

  const getStepStatus = (step: CreateStep): 'completed' | 'current' | 'upcoming' => {
    const stepOrder: CreateStep[] = ['title', 'upload', 'extract', 'processing', 'preview'];
    const currentIndex = stepOrder.indexOf(createStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Passage to Test</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose an existing passage or create a new one from images
          </DialogDescription>
        </DialogHeader>

        {/* Error/Success Messages */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">{successMessage}</AlertDescription>
          </Alert>
        )}
        {extractionError && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-red-300">{extractionError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existing' | 'create')} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="existing" className="data-[state=active]:bg-indigo-600">
              <Library className="h-4 w-4 mr-2" />
              Choose Existing
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-indigo-600">
              <ImagePlus className="h-4 w-4 mr-2" />
              Create from Images
            </TabsTrigger>
          </TabsList>

          {/* Existing Passages Tab */}
          <TabsContent value="existing" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search passages by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Passages List */}
            <ScrollArea className="flex-1 pr-4">
              {isLoadingPassages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  <span className="ml-2 text-slate-400">Loading passages...</span>
                </div>
              ) : passages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  {searchQuery ? 'No passages match your search' : 'No passages available'}
                </div>
              ) : (
                <div className="space-y-2">
                  {passages.map((passage) => (
                    <Card
                      key={passage.id}
                      className={`cursor-pointer transition-all ${
                        selectedPassageId === passage.id
                          ? 'bg-indigo-600/20 border-indigo-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedPassageId(passage.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white truncate">{passage.title}</h4>
                              {selectedPassageId === passage.id && (
                                <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge className={getDifficultyColor(passage.difficulty_level)}>
                                {getDifficultyLabel(passage.difficulty_level)}
                              </Badge>
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {passage.topic}
                              </Badge>
                              <span className="text-slate-500 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {passage.word_count} words
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Load More Button */}
                  {paginationMeta && paginationMeta.has_next && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More ({paginationMeta.total_count - passages.length} remaining)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Add Button */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
              <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button
                onClick={handleAddExistingPassage}
                disabled={!selectedPassageId || isAddingPassage}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                {isAddingPassage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Test
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Create New Tab */}
          <TabsContent value="create" className="flex-1 overflow-hidden flex flex-col mt-4 min-h-0">
            {/* Progress Stepper - only show when not in preview */}
            {createStep !== 'preview' && (
              <div className="flex items-center justify-between mb-6 px-2 flex-shrink-0">
                {CREATE_STEPS.map((step, index) => {
                  const status = getStepStatus(step.id);
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs ${
                            status === 'completed'
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : status === 'current'
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-slate-600 text-slate-500'
                          }`}
                        >
                          {status === 'completed' ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className={`text-xs ${status === 'current' ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < CREATE_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 ${
                            getStepStatus(CREATE_STEPS[index + 1].id) !== 'upcoming'
                              ? 'bg-indigo-600'
                              : 'bg-slate-700'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0">
              {/* Step 1: Title */}
              {createStep === 'title' && (
                <div className="space-y-4 px-1">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Passage Title
                    </label>
                    <Input
                      placeholder="e.g., Reading Passage 1: The History of Chocolate"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePassage()}
                      className="bg-slate-800 border-slate-700 text-white"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePassage} disabled={!title.trim() || isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Upload Images */}
              {createStep === 'upload' && (
                <div className="space-y-4 px-1">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Upload Images
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Upload images containing the passage text and questions
                    </p>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {/* Upload button */}
                    <Button
                      variant="outline"
                      onClick={handleUploadClick}
                      className="w-full h-32 border-dashed border-2 border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="text-slate-400">Click to select images</span>
                        <span className="text-xs text-slate-500">or drag and drop</span>
                      </div>
                    </Button>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300">
                        Selected Images ({selectedImages.length}):
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedImages.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileImage className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-sm text-slate-300 truncate">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep('title')}
                      className="border-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleUploadImages}
                      disabled={selectedImages.length === 0 || isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Extract */}
              {createStep === 'extract' && (
                <div className="space-y-4 px-1">
                  <Alert className="bg-slate-800 border-slate-700">
                    <AlertDescription className="text-slate-300">
                      <strong>{selectedImages.length} images uploaded successfully.</strong>
                      <br />
                      Click the button below to start AI extraction. This may take 30-60 seconds.
                    </AlertDescription>
                  </Alert>

                  {currentExtendedPassage?.images && currentExtendedPassage.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {currentExtendedPassage.images.slice(0, 6).map((img) => (
                        <div key={img.id} className="border border-slate-700 rounded overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={img.fileName}
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep('upload')}
                      className="border-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={handleTriggerExtraction}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start AI Extraction
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Processing */}
              {createStep === 'processing' && (
                <div className="space-y-4 px-1">
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                    <div className="text-center space-y-1">
                      <p className="text-white font-medium">Processing images...</p>
                      <p className="text-sm text-slate-400">Time elapsed: {elapsedTime}s</p>
                    </div>
                  </div>
                  <Progress value={(elapsedTime / 60) * 100} className="w-full" />
                  <p className="text-xs text-slate-500 text-center">
                    AI is extracting passage text and questions from your images
                  </p>
                </div>
              )}

              {/* Step 5: Preview - Use the full PassagePreview component */}
              {createStep === 'preview' && currentExtendedPassage && (
                <div className="space-y-4 px-1 pb-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Passage Preview</h2>
                      <p className="text-slate-400 text-sm">Review and edit the extracted content</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {currentExtendedPassage.status}
                      </Badge>
                      {currentExtendedPassage.wordCount && (
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {currentExtendedPassage.wordCount} words
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Passage Content */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{currentExtendedPassage.title}</h3>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {currentExtendedPassage.content}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Questions Preview */}
                  {currentExtendedPassage.questionGroups && currentExtendedPassage.questionGroups.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="pt-4">
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Questions ({currentExtendedPassage.totalQuestions})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {currentExtendedPassage.questionGroups.map((group, groupIndex) => (
                            <div key={group.id} className="border border-slate-600 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
                                  Q{group.startNumber}-{group.endNumber}
                                </Badge>
                                <span className="text-sm font-medium text-white">{group.type}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">{group.instructions}</p>
                              <div className="space-y-1">
                                {group.questions.map((q) => (
                                  <div key={q.id} className="text-sm bg-slate-900/50 rounded p-2">
                                    <span className="text-indigo-400 font-medium">Q{q.questionNumber}:</span>{' '}
                                    <span className="text-slate-300">{q.text}</span>
                                    <span className="text-emerald-400 ml-2 text-xs">
                                      Answer: {q.correctAnswer}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="flex justify-between gap-2 pt-4 border-t border-slate-700 sticky bottom-0 bg-slate-900 pb-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetCreateState();
                      }}
                      className="border-slate-700 text-slate-300"
                    >
                      Start Over
                    </Button>
                    <Button 
                      onClick={handleFinalizeAndAdd} 
                      disabled={isFinalizing}
                      className="bg-indigo-600 hover:bg-indigo-500"
                    >
                      {isFinalizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating & Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create & Add to Test
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddPassageModal;
