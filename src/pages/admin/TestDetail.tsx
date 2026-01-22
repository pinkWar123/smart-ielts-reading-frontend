import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  FileText,
  Clock,
  ChevronLeft,
  Shield,
  Sparkles,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  Eye,
  Send,
  RotateCcw,
  Calendar,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';
import {
  testsApi,
  type TestDetailResponse,
  type TestPassageSummary,
  type FullTestDetailResponse,
  type FullTestPassage,
  type FullTestQuestionGroup,
  type FullTestQuestion,
  type GetTestDetailWithViewResponse,
  type TestDetailPassageDTO,
  type PassageDetailQuestionGroupDTO,
  type PassageDetailQuestionDTO,
} from '@/lib/api/tests';
import { AddPassageModal } from '@/components/admin/AddPassageModal';

const MAX_PASSAGES_FULL_TEST = 3;
const MAX_PASSAGES_SINGLE = 1;

// Combined type for test with all info
interface TestWithDetails {
  id: string;
  title: string;
  description: string | null;
  test_type: 'FULL_TEST' | 'SINGLE_PASSAGE';
  time_limit_minutes: number;
  total_questions: number;
  total_points: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  passage_count: number;
  passages: TestPassageSummary[];
  created_by: { full_name: string };
  created_at: string;
}

export const TestDetail: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<TestWithDetails | null>(null);
  const [fullTest, setFullTest] = useState<FullTestDetailResponse | null>(null);
  const [testDetailWithView, setTestDetailWithView] = useState<GetTestDetailWithViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [activePassageTab, setActivePassageTab] = useState<string>('0');
  const [showAddPassageModal, setShowAddPassageModal] = useState(false);

  useEffect(() => {
    if (testId) {
      loadTestDetail();
    }
  }, [testId]);

  const loadTestDetail = async () => {
    if (!testId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both test list (for metadata) and test detail (for passages)
      const [listResponse, detailResponse] = await Promise.all([
        testsApi.getAllTests(),
        testsApi.getTestDetail(testId),
      ]);
      
      // Find the test in the list to get full metadata
      const testFromList = listResponse.tests.find(t => t.test_id === testId);
      
      if (testFromList) {
        setTest({
          id: testId,
          title: testFromList.title,
          description: null,
          test_type: testFromList.type,
          time_limit_minutes: testFromList.time_limit_minutes,
          total_questions: testFromList.total_questions,
          total_points: testFromList.total_points,
          status: testFromList.status,
          passage_count: detailResponse.passage_count,
          passages: detailResponse.passages,
          created_by: testFromList.created_by,
          created_at: new Date().toISOString(),
        });
      } else {
        setTest({
          id: detailResponse.id,
          title: 'Test',
          description: null,
          test_type: 'SINGLE_PASSAGE',
          time_limit_minutes: 20,
          total_questions: 0,
          total_points: 0,
          status: 'DRAFT',
          passage_count: detailResponse.passage_count,
          passages: detailResponse.passages,
          created_by: { full_name: 'Unknown' },
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to load test detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullTestDetail = async () => {
    if (!testId) return;
    
    setIsLoadingQuestions(true);
    try {
      // Try the new API endpoint first
      const data = await testsApi.getTestDetailWithView(testId, 'ADMIN');
      setTestDetailWithView(data);
      
      // Convert to FullTestDetailResponse format for compatibility
      const convertedFullTest: FullTestDetailResponse = {
        passages: data.passages.map(p => ({
          title: p.title,
          content: p.content,
          difficulty_level: p.difficulty_level,
          topic: p.topic,
          source: p.source,
          question_groups: p.question_groups.map(g => ({
            id: g.id,
            group_instructions: g.group_instructions,
            question_type: g.question_type,
            start_question_number: g.start_question_number,
            end_question_number: g.end_question_number,
            order_in_passage: g.order_in_passage,
            options: g.options,
            questions: (g.questions || []).map(q => ({
              question_number: q.question_number,
              question_type: q.question_type,
              question_text: q.question_text,
              options: q.options,
              correct_answer: {
                answer: q.correct_answer?.answer || '',
                acceptable_answers: q.correct_answer?.acceptable_answers,
              },
              explanation: q.explanation,
              instructions: q.instructions,
              points: q.points,
              order_in_passage: q.order_in_passage,
              question_group_id: q.question_group_id,
            })),
          })),
        })),
        test_metadata: {
          title: data.test_metadata.title || 'Test',
          description: data.test_metadata.description,
          total_questions: data.test_metadata.total_questions,
          estimated_time_minutes: data.test_metadata.estimated_time_minutes,
          type: data.test_metadata.type,
          status: data.test_metadata.status,
          created_by: {
            id: data.test_metadata.created_by.id,
            name: data.test_metadata.created_by.name,
            email: data.test_metadata.created_by.email,
          },
          created_at: data.test_metadata.created_at,
          updated_at: data.test_metadata.updated_at,
        },
      };
      
      setFullTest(convertedFullTest);
      setShowQuestions(true);
    } catch (err) {
      console.error('Failed to load full test detail with new API, trying fallback:', err);
      
      // Fallback to old API
      try {
        const data = await testsApi.getFullTestDetail(testId);
        setFullTest(data);
        setShowQuestions(true);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load questions');
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handlePublish = async () => {
    if (!test) return;
    
    setIsPublishing(true);
    try {
      if (test.status === 'PUBLISHED') {
        await testsApi.unpublishTest(test.id);
      } else {
        await testsApi.publishTest(test.id);
      }
      await loadTestDetail();
    } catch (err) {
      console.error('Failed to publish/unpublish test:', err);
      setError(err instanceof Error ? err.message : 'Failed to update test status');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!test) return;
    
    setIsDeleting(true);
    try {
      await testsApi.deleteTest(test.id);
      navigate('/admin');
    } catch (err) {
      console.error('Failed to delete test:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete test');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getMaxPassages = () => {
    return test?.test_type === 'FULL_TEST' ? MAX_PASSAGES_FULL_TEST : MAX_PASSAGES_SINGLE;
  };

  const canAddMorePassages = () => {
    if (!test) return false;
    return test.passage_count < getMaxPassages();
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      case 4: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 2: return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 3: return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 4: return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'TRUE_FALSE_NOTGIVEN': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'YES_NO_NOTGIVEN': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'MATCHING_HEADINGS': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'MATCHING_INFORMATION': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'SENTENCE_COMPLETION': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SUMMARY_COMPLETION': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'SHORT_ANSWER': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
          <p className="text-slate-400">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

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
        <Link to="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Test Header Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl text-white">{test.title}</CardTitle>
                  <Badge
                    className={
                      test.status === 'PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : test.status === 'DRAFT'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }
                  >
                    {test.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      test.test_type === 'FULL_TEST'
                        ? 'border-indigo-500/30 text-indigo-300'
                        : 'border-purple-500/30 text-purple-300'
                    }
                  >
                    {test.test_type === 'FULL_TEST' ? 'Full Test' : 'Single Passage'}
                  </Badge>
                </div>
                {test.description && (
                  <CardDescription className="text-slate-400 text-base">
                    {test.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(test.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                  onClick={loadFullTestDetail}
                  disabled={isLoadingQuestions || test.passage_count === 0}
                >
                  {isLoadingQuestions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ListChecks className="h-4 w-4 mr-2" />
                  )}
                  {showQuestions ? 'Refresh Questions' : 'Preview Questions'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => navigate(`/admin/test/${test.id}/edit`)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>
                  <span className="text-white font-medium">{test.passage_count}</span>
                  {' / '}{getMaxPassages()} passages
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>
                  <span className="text-white font-medium">{test.total_questions}</span> questions
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>
                  <span className="text-white font-medium">{test.time_limit_minutes}</span> minutes
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>
                  <span className="text-white font-medium">{test.total_points}</span> points
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <div className="flex items-center justify-between">
                <span>Are you sure you want to delete this test? This action cannot be undone.</span>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Questions Preview Section */}
        {showQuestions && fullTest && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-indigo-400" />
                    Questions Preview
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {fullTest.test_metadata.total_questions} questions across {fullTest.passages.length} passage(s)
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestions(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fullTest.passages.length > 1 ? (
                <Tabs value={activePassageTab} onValueChange={setActivePassageTab}>
                  <TabsList className="bg-slate-800/50 border border-slate-700 mb-4">
                    {fullTest.passages.map((passage, index) => (
                      <TabsTrigger
                        key={index}
                        value={index.toString()}
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                      >
                        Passage {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {fullTest.passages.map((passage, index) => (
                    <TabsContent key={index} value={index.toString()}>
                      <PassageQuestionsView
                        passage={passage}
                        passageIndex={index}
                        getQuestionTypeLabel={getQuestionTypeLabel}
                        getQuestionTypeColor={getQuestionTypeColor}
                        getDifficultyLabel={getDifficultyLabel}
                        getDifficultyColor={getDifficultyColor}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              ) : fullTest.passages.length === 1 ? (
                <PassageQuestionsView
                  passage={fullTest.passages[0]}
                  passageIndex={0}
                  getQuestionTypeLabel={getQuestionTypeLabel}
                  getQuestionTypeColor={getQuestionTypeColor}
                  getDifficultyLabel={getDifficultyLabel}
                  getDifficultyColor={getDifficultyColor}
                />
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No passages in this test
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passages Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Passages</h2>
            {canAddMorePassages() && (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-500"
                onClick={() => setShowAddPassageModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Passage
              </Button>
            )}
          </div>

          {test.passages.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-400">No passages added yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Add passages to complete this test
                    </p>
                  </div>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-500 mt-4"
                    onClick={() => setShowAddPassageModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Passage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {test.passages.map((passage, index) => (
                <PassageCard
                  key={passage.id}
                  passage={passage}
                  index={index + 1}
                  testId={test.id}
                  getDifficultyLabel={getDifficultyLabel}
                  getDifficultyColor={getDifficultyColor}
                  onRefresh={loadTestDetail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Publish Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Publish Test</CardTitle>
            <CardDescription className="text-slate-400">
              {test.status === 'PUBLISHED'
                ? 'This test is currently published and visible to students.'
                : 'Publish this test to make it available to students.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {test.status === 'DRAFT' && test.passage_count === 0 && (
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Add at least one passage before publishing
                  </p>
                )}
                {test.status === 'DRAFT' && test.passage_count > 0 && test.total_questions === 0 && (
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Test has no questions. Add questions to passages before publishing.
                  </p>
                )}
              </div>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || (test.status === 'DRAFT' && test.passage_count === 0)}
                className={
                  test.status === 'PUBLISHED'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {test.status === 'PUBLISHED' ? 'Unpublishing...' : 'Publishing...'}
                  </>
                ) : test.status === 'PUBLISHED' ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Passage Modal */}
      <AddPassageModal
        isOpen={showAddPassageModal}
        onClose={() => setShowAddPassageModal(false)}
        testId={test.id}
        existingPassageIds={test.passages.map((p) => p.id)}
        onPassageAdded={loadTestDetail}
      />
    </div>
  );
};

// Component for displaying passage questions
interface PassageQuestionsViewProps {
  passage: FullTestPassage;
  passageIndex: number;
  getQuestionTypeLabel: (type: string) => string;
  getQuestionTypeColor: (type: string) => string;
  getDifficultyLabel: (level: number) => string;
  getDifficultyColor: (level: number) => string;
}

const PassageQuestionsView: React.FC<PassageQuestionsViewProps> = ({
  passage,
  passageIndex,
  getQuestionTypeLabel,
  getQuestionTypeColor,
  getDifficultyLabel,
  getDifficultyColor,
}) => {
  const [showContent, setShowContent] = useState(false);

  const totalQuestions = passage.question_groups.reduce(
    (sum, group) => sum + group.questions.length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Passage Info */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{passage.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getDifficultyColor(passage.difficulty_level)}>
                {getDifficultyLabel(passage.difficulty_level)}
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {passage.topic}
              </Badge>
              <span className="text-sm text-slate-400">
                {totalQuestions} questions
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContent(!showContent)}
            className="text-slate-400 hover:text-white"
          >
            {showContent ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Content
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Content
              </>
            )}
          </Button>
        </div>
        {showContent && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {passage.content}
            </p>
          </div>
        )}
      </div>

      {/* Question Groups */}
      <Accordion type="multiple" className="w-full space-y-2">
        {passage.question_groups.map((group, groupIndex) => (
          <AccordionItem
            key={group.id}
            value={group.id}
            className="border border-slate-700 rounded-lg bg-slate-800/20 overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-slate-800/30 hover:no-underline">
              <div className="flex items-center gap-3">
                <Badge className={getQuestionTypeColor(group.question_type)}>
                  Q{group.start_question_number}-{group.end_question_number}
                </Badge>
                <span className="text-white font-medium">
                  {getQuestionTypeLabel(group.question_type)}
                </span>
                <span className="text-slate-400 text-sm">
                  ({group.questions.length} questions)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* Group Instructions */}
              {group.group_instructions && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-indigo-200">
                    <span className="font-medium">Instructions:</span> {group.group_instructions}
                  </p>
                </div>
              )}

              {/* Group Options (for matching questions) */}
              {group.options && group.options.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
                  <p className="text-sm font-medium text-slate-400 mb-2">Options:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => (
                      <div key={option.label} className="text-sm">
                        <span className="font-medium text-indigo-400">{option.label}.</span>{' '}
                        <span className="text-slate-300">{option.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-3">
                {group.questions.map((question) => (
                  <QuestionCard
                    key={question.question_number}
                    question={question}
                    groupOptions={group.options}
                    getQuestionTypeLabel={getQuestionTypeLabel}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

// Component for individual question
interface QuestionCardProps {
  question: FullTestQuestion;
  groupOptions?: { label: string; text: string }[] | null;
  getQuestionTypeLabel: (type: string) => string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  groupOptions,
  getQuestionTypeLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(question.question_text);
  const [editedAnswer, setEditedAnswer] = useState(
    typeof question.correct_answer.answer === 'string'
      ? question.correct_answer.answer
      : JSON.stringify(question.correct_answer.answer)
  );

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log('Saving question:', { text: editedText, answer: editedAnswer });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(question.question_text);
    setEditedAnswer(
      typeof question.correct_answer.answer === 'string'
        ? question.correct_answer.answer
        : JSON.stringify(question.correct_answer.answer)
    );
    setIsEditing(false);
  };

  // Get options to display (either from question or from group)
  const displayOptions = question.options || groupOptions;

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              Q{question.question_number}
            </Badge>
            <span className="text-xs text-slate-500">{question.points} pt</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Question Text</label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
              className="bg-slate-800 border-slate-600 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Correct Answer</label>
            <Input
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Q{question.question_number}
                </Badge>
                <span className="text-xs text-slate-500">{question.points} pt</span>
              </div>
              <p className="text-slate-200">{question.question_text}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Question-specific options (for multiple choice) */}
          {question.options && question.options.length > 0 && (
            <div className="mt-3 space-y-1 ml-4">
              {question.options.map((option) => {
                const isCorrect = option.label === question.correct_answer.answer;
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
                      {option.label}.
                    </span>{' '}
                    <span className="text-slate-300">{option.text}</span>
                    {isCorrect && (
                      <Check className="inline-block h-3 w-3 ml-2 text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Correct Answer Display */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Answer:</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {typeof question.correct_answer.answer === 'string'
                ? question.correct_answer.answer
                : JSON.stringify(question.correct_answer.answer)}
            </Badge>
            {question.correct_answer.acceptable_answers && question.correct_answer.acceptable_answers.length > 0 && (
              <span className="text-xs text-slate-500">
                (also accepts: {question.correct_answer.acceptable_answers.join(', ')})
              </span>
            )}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-2 p-2 bg-slate-800/30 rounded text-sm text-slate-400">
              <span className="font-medium">Explanation:</span> {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate component for passage card
interface PassageCardProps {
  passage: TestPassageSummary;
  index: number;
  testId: string;
  getDifficultyLabel: (level: number) => string;
  getDifficultyColor: (level: number) => string;
  onRefresh: () => void;
}

const PassageCard: React.FC<PassageCardProps> = ({
  passage,
  index,
  testId,
  getDifficultyLabel,
  getDifficultyColor,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Remove this passage from the test?')) return;
    
    setIsRemoving(true);
    try {
      await testsApi.removePassageFromTest(testId, passage.id);
      onRefresh();
    } catch (err) {
      console.error('Failed to remove passage:', err);
      alert('Failed to remove passage');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card 
      className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
      onClick={() => navigate(`/admin/test/${testId}/passage/${passage.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="text-indigo-400 font-semibold">{index}</span>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-white group-hover:text-indigo-300 transition-colors">
                {passage.title}
              </CardTitle>
              <CardDescription className="text-slate-400 line-clamp-2">
                {passage.reduced_content}...
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(passage.difficulty_level)}>
              {getDifficultyLabel(passage.difficulty_level)}
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {passage.topic}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {passage.word_count} words
            </span>
            {passage.source && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {passage.source}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(passage.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/test/${testId}/passage/${passage.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDetail;
