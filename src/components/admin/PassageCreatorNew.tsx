import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Upload,
  Loader2,
  FileImage,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import useAdminStore from '@/lib/stores/adminStore';
import { PassagePreview } from './PassagePreview';

type Step = 'title' | 'upload' | 'extract' | 'processing' | 'preview' | 'finalized';

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: 'title', label: 'Title', description: 'Enter passage title' },
  { id: 'upload', label: 'Upload', description: 'Upload images' },
  { id: 'extract', label: 'Extract', description: 'Extract content' },
  { id: 'processing', label: 'Processing', description: 'AI extraction' },
  { id: 'preview', label: 'Preview', description: 'Review & edit' },
];

export const PassageCreatorNew: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('title');
  const [title, setTitle] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    currentExtendedPassage,
    extractionStatus,
    extractionError,
    isLoading,
    createEmptyPassage,
    uploadPassageImages,
    triggerExtraction,
    finalizePassageWorkflow,
    resetPassageWorkflow,
  } = useAdminStore();

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
    if (extractionStatus === 'completed' && currentStep === 'processing') {
      setCurrentStep('preview');
    }
  }, [extractionStatus, currentStep]);

  const handleCreatePassage = async () => {
    if (!title.trim()) {
      alert('Please enter a passage title');
      return;
    }

    try {
      await createEmptyPassage(title);
      setCurrentStep('upload');
    } catch (error) {
      console.error('Failed to create passage:', error);
      alert('Failed to create passage. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (!currentExtendedPassage || selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      await uploadPassageImages(currentExtendedPassage.id, selectedImages);
      setCurrentStep('extract');
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Failed to upload images. Please try again.');
    }
  };

  const handleTriggerExtraction = async () => {
    if (!currentExtendedPassage) return;

    try {
      setCurrentStep('processing');
      await triggerExtraction(currentExtendedPassage.id);
    } catch (error) {
      console.error('Failed to trigger extraction:', error);
      alert('Failed to trigger extraction. Please try again.');
      setCurrentStep('extract');
    }
  };

  const handleFinalize = async () => {
    if (!currentExtendedPassage) return;

    try {
      await finalizePassageWorkflow(currentExtendedPassage.id);
      setCurrentStep('finalized');
    } catch (error) {
      console.error('Failed to finalize passage:', error);
      alert('Failed to finalize passage. Please try again.');
    }
  };

  const handleReset = () => {
    resetPassageWorkflow();
    setTitle('');
    setSelectedImages([]);
    setCurrentStep('title');
    setElapsedTime(0);
  };

  const getStepStatus = (step: Step): 'completed' | 'current' | 'upcoming' => {
    const stepOrder: Step[] = ['title', 'upload', 'extract', 'processing', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Passage from Images</h2>
        <p className="text-muted-foreground">
          Upload images and let AI extract the passage and questions
        </p>
      </div>

      {/* Progress Stepper */}
      {currentStep !== 'finalized' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(step.id);
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            status === 'completed'
                              ? 'bg-primary border-primary text-primary-foreground'
                              : status === 'current'
                              ? 'border-primary text-primary'
                              : 'border-muted text-muted-foreground'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{step.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {step.description}
                          </div>
                        </div>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            getStepStatus(STEPS[index + 1].id) === 'completed'
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {extractionError && (
        <Alert variant="destructive">
          <AlertDescription>{extractionError}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Title */}
      {currentStep === 'title' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Passage Title</CardTitle>
            <CardDescription>
              Give your passage a descriptive title
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="e.g., Reading Passage 1: The History of Chocolate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePassage()}
              autoFocus
            />
            <div className="flex justify-end">
              <Button onClick={handleCreatePassage} disabled={!title.trim() || isLoading}>
                {isLoading ? (
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
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Images */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload Images</CardTitle>
            <CardDescription>
              Select images containing the passage and questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>

            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected images ({selectedImages.length}):
                </p>
                <div className="space-y-2">
                  {selectedImages.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileImage className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('title')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleUploadImages}
                disabled={selectedImages.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Trigger Extraction */}
      {currentStep === 'extract' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Extract Content</CardTitle>
            <CardDescription>
              Start AI extraction process to get passage and questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>{selectedImages.length} images uploaded successfully.</strong>
                <br />
                Click the button below to start extracting the passage text and questions.
                This process may take 30-60 seconds.
              </AlertDescription>
            </Alert>

            {currentExtendedPassage?.images && currentExtendedPassage.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {currentExtendedPassage.images.map((img) => (
                  <div key={img.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={img.imageUrl}
                      alt={img.fileName}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 text-xs text-muted-foreground">
                      {img.fileName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleTriggerExtraction}>
                <Loader2 className="mr-2 h-4 w-4" />
                Start Extraction
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Processing */}
      {currentStep === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Extracting Content</CardTitle>
            <CardDescription>
              AI is analyzing your images and extracting content...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Processing your images...</p>
                <p className="text-sm text-muted-foreground">
                  Time elapsed: {elapsedTime}s
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated time: 30-60 seconds
                </p>
              </div>
            </div>

            <Progress value={(elapsedTime / 60) * 100} className="w-full" />

            <Alert>
              <AlertDescription>
                The AI is reading your images and extracting:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Passage title and content</li>
                  <li>Question groups and instructions</li>
                  <li>Individual questions with correct answers</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview */}
      {currentStep === 'preview' && currentExtendedPassage && (
        <PassagePreview passage={currentExtendedPassage} onFinalize={handleFinalize} />
      )}

      {/* Finalized State */}
      {currentStep === 'finalized' && currentExtendedPassage && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Passage Finalized!</h3>
                <p className="text-muted-foreground">
                  <strong>{currentExtendedPassage.title}</strong> is now ready to be added to tests.
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <Badge variant="outline">{currentExtendedPassage.wordCount} words</Badge>
                  <Badge variant="outline">{currentExtendedPassage.totalQuestions} questions</Badge>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleReset}>
                  Create Another Passage
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin/test/new'}>
                  Add to Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
