import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  testsApi,
  type SingleTestDTO,
  type FullTestDTO,
  type PaginationMeta,
  type GetTestDetailWithViewResponse,
} from '@/lib/api/tests';
import { TestSelectionModal, type TestStartConfig } from '@/components/student/TestSelectionModal';

const PAGE_SIZE = 9;

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Full tests state
  const [fullTests, setFullTests] = useState<FullTestDTO[]>([]);
  const [fullTestsMeta, setFullTestsMeta] = useState<PaginationMeta | null>(null);
  const [fullTestsPage, setFullTestsPage] = useState(1);
  const [fullTestsLoading, setFullTestsLoading] = useState(false);

  // Single tests state
  const [singleTests, setSingleTests] = useState<SingleTestDTO[]>([]);
  const [singleTestsMeta, setSingleTestsMeta] = useState<PaginationMeta | null>(null);
  const [singleTestsPage, setSingleTestsPage] = useState(1);
  const [singleTestsLoading, setSingleTestsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testDetailData, setTestDetailData] = useState<GetTestDetailWithViewResponse | null>(null);
  const [testDetailLoading, setTestDetailLoading] = useState(false);

  // Load full tests
  const loadFullTests = useCallback(async (page: number) => {
    setFullTestsLoading(true);
    setError(null);
    try {
      const response = await testsApi.getPaginatedFullTests(page, PAGE_SIZE);
      setFullTests(response.data);
      setFullTestsMeta(response.meta);
    } catch (err) {
      console.error('Failed to load full tests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load full tests');
    } finally {
      setFullTestsLoading(false);
    }
  }, []);

  // Load single tests
  const loadSingleTests = useCallback(async (page: number) => {
    setSingleTestsLoading(true);
    setError(null);
    try {
      const response = await testsApi.getPaginatedSingleTests(page, PAGE_SIZE);
      setSingleTests(response.data);
      setSingleTestsMeta(response.meta);
    } catch (err) {
      console.error('Failed to load single tests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load single tests');
    } finally {
      setSingleTestsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFullTests(fullTestsPage);
  }, [fullTestsPage, loadFullTests]);

  useEffect(() => {
    loadSingleTests(singleTestsPage);
  }, [singleTestsPage, loadSingleTests]);

  // Filter tests by search query (client-side for current page)
  const filteredFullTests = fullTests.filter(test =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSingleTests = singleTests.filter(test =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle test click - open modal and load test details
  const handleTestClick = async (testId: string) => {
    setSelectedTestId(testId);
    setIsModalOpen(true);
    setTestDetailLoading(true);
    setTestDetailData(null);
    setError(null);

    try {
      // First try getTestDetailWithView
      const data = await testsApi.getTestDetailWithView(testId, 'USER');
      console.log('API Response:', data);
      setTestDetailData(data);
    } catch (err) {
      console.error('Failed to load test details:', err);
      
      // If that fails, try getFullTestDetail as fallback
      try {
        const fullData = await testsApi.getFullTestDetail(testId);
        console.log('Full API Response:', fullData);
        
        // Transform to match the expected format
        const transformedData: GetTestDetailWithViewResponse = {
          passages: fullData.passages.map(p => ({
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
              questions: g.questions.map(q => ({
                question_number: q.question_number,
                question_type: q.question_type,
                question_text: q.question_text,
                options: q.options,
                correct_answer: null, // Hide for student view
                explanation: null,
                instructions: q.instructions,
                points: q.points,
                order_in_passage: q.order_in_passage,
                question_group_id: q.question_group_id,
              })),
            })),
          })),
          test_metadata: {
            title: fullData.test_metadata.title,
            description: fullData.test_metadata.description,
            total_questions: fullData.test_metadata.total_questions,
            estimated_time_minutes: fullData.test_metadata.estimated_time_minutes,
            type: fullData.test_metadata.type,
            status: fullData.test_metadata.status,
            created_by: {
              id: fullData.test_metadata.created_by.id,
              name: fullData.test_metadata.created_by.name,
              email: fullData.test_metadata.created_by.email,
            },
            created_at: fullData.test_metadata.created_at,
            updated_at: fullData.test_metadata.updated_at,
          },
        };
        
        setTestDetailData(transformedData);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(err instanceof Error ? err.message : 'Failed to load test details');
        setIsModalOpen(false);
      }
    } finally {
      setTestDetailLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTestId(null);
    setTestDetailData(null);
  };

  // Handle start test
  const handleStartTest = (config: TestStartConfig) => {
    if (!selectedTestId) return;

    const params = new URLSearchParams({
      testId: selectedTestId,
      time: config.timeMinutes.toString(),
      passages: config.selectedPassageIndices.join(','),
    });

    navigate(`/test/take?${params.toString()}`);
  };

  const formatQuestionTypes = (types: string[]) => {
    if (types.length === 0) return 'Various';
    if (types.length <= 2) {
      return types.map(t => t.replace(/_/g, ' ').toLowerCase()).join(', ');
    }
    return `${types.length} question types`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            IELTS Reading Practice
          </h1>
          <p className="text-lg text-slate-400">
            Choose a test to start practicing
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Test Categories */}
        <div className="space-y-12">
          {/* Full Tests Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Full Tests</h2>
                <p className="text-slate-500 mt-1">Complete IELTS Reading tests with 3 passages</p>
              </div>
              {fullTestsMeta && (
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {fullTestsMeta.total_items} tests
                </Badge>
              )}
            </div>

            {fullTestsLoading ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <span className="text-slate-400">Loading tests...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredFullTests.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <p className="text-center text-slate-500">No full tests available yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFullTests.map((test) => (
                    <Card 
                      key={test.id} 
                      className="group bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => handleTestClick(test.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <CardHeader className="relative">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <BookOpen className="h-5 w-5 text-emerald-400" />
                          </div>
                          <span className="line-clamp-1">{test.title}</span>
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                          Full IELTS Reading Test
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">60 minutes</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            3 passages
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            40 questions
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-slate-800 hover:bg-emerald-600 text-white border-0 transition-colors"
                        >
                          Start Test
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination for Full Tests */}
                {fullTestsMeta && fullTestsMeta.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullTestsPage(p => p - 1)}
                      disabled={!fullTestsMeta.has_previous}
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-500">
                      Page {fullTestsMeta.current_page} of {fullTestsMeta.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullTestsPage(p => p + 1)}
                      disabled={!fullTestsMeta.has_next}
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Single Passage Tests Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Single Passage Tests</h2>
                <p className="text-slate-500 mt-1">Practice with individual passages</p>
              </div>
              {singleTestsMeta && (
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {singleTestsMeta.total_items} tests
                </Badge>
              )}
            </div>

            {singleTestsLoading ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <span className="text-slate-400">Loading tests...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredSingleTests.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <p className="text-center text-slate-500">
                    No single passage tests available yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSingleTests.map((test) => (
                    <Card 
                      key={test.id} 
                      className="group bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => handleTestClick(test.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <CardHeader className="relative">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <BookOpen className="h-5 w-5 text-purple-400" />
                          </div>
                          <span className="line-clamp-1">{test.title}</span>
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                          {formatQuestionTypes(test.question_types)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">~20 minutes</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            1 passage
                          </Badge>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            13-14 questions
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-slate-800 hover:bg-purple-600 text-white border-0 transition-colors"
                        >
                          Start Test
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination for Single Tests */}
                {singleTestsMeta && singleTestsMeta.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSingleTestsPage(p => p - 1)}
                      disabled={!singleTestsMeta.has_previous}
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-500">
                      Page {singleTestsMeta.current_page} of {singleTestsMeta.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSingleTestsPage(p => p + 1)}
                      disabled={!singleTestsMeta.has_next}
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-600 text-sm">
          IELTS Reading Practice Platform © 2026
        </footer>
      </div>

      {/* Test Selection Modal */}
      <TestSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onStart={handleStartTest}
        testData={testDetailData}
        isLoading={testDetailLoading}
      />
    </div>
  );
};
