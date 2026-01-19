import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '@/lib/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  Plus,
  Clock,
  Upload,
  ChevronLeft,
  LogOut,
  Shield,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { testsApi, type TestListItem } from '@/lib/api/tests';
import { useAuthStore } from '@/lib/stores/authStore';

export const AdminDashboard: React.FC = () => {
  const { tests: localTests, passages: localPassages, loadTests, loadPassages } = useAdminStore();
  const { user, logout } = useAuthStore();

  // API tests state
  const [apiTests, setApiTests] = useState<TestListItem[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [testsError, setTestsError] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
    loadPassages();
    loadApiTests();
  }, [loadTests, loadPassages]);

  const loadApiTests = async () => {
    setIsLoadingTests(true);
    setTestsError(null);
    try {
      const response = await testsApi.getAllTests();
      setApiTests(response.tests);
    } catch (err) {
      console.error('Failed to load tests from API:', err);
      setTestsError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

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
              <Badge className={
                user?.role === 'TEACHER'
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }>
                <Shield className="h-3 w-3 mr-1" />
                {user?.role === 'TEACHER' ? 'Teacher' : 'Admin'}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-slate-400">
                  Welcome, <span className="text-white">{user.full_name}</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {user?.role === 'TEACHER' ? 'Teacher Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-slate-400">
            {user?.role === 'TEACHER' 
              ? 'Manage your classes, sessions, and student progress' 
              : 'Manage your IELTS reading tests and passages'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoadingTests ? <Loader2 className="h-6 w-6 animate-spin" /> : apiTests.length}
              </div>
              <p className="text-xs text-slate-500">
                {apiTests.filter((t) => t.status === 'PUBLISHED').length} published
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Passages</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {apiTests.reduce((sum, t) => sum + t.passage_count, 0)}
              </div>
              <p className="text-xs text-slate-500">Across all tests</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Questions</CardTitle>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {apiTests.reduce((sum, t) => sum + t.total_questions, 0)}
              </div>
              <p className="text-xs text-slate-500">Total questions</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Full Tests</CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {apiTests.filter((t) => t.type === 'FULL_TEST').length}
              </div>
              <p className="text-xs text-slate-500">60 minutes each</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Class Management - Always visible */}
            <Link to="/admin/classes">
              <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    Manage Classes
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Create and manage teaching classes and student enrollment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                    Get Started
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Session Management - Always visible */}
            <Link to="/admin/sessions">
              <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <Calendar className="h-5 w-5 text-green-400" />
                    </div>
                    Manage Sessions
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Schedule and monitor exercise sessions for your classes
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Admin-only actions */}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/test/new">
                  <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-400/50 transition-all cursor-pointer group h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                          <Plus className="h-5 w-5 text-indigo-400" />
                        </div>
                        Create New Test
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Build a full test or single passage test with AI-powered image extraction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                        Get Started
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/admin/passage/new-from-images">
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <Upload className="h-5 w-5 text-purple-400" />
                        </div>
                        Create from Images
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Upload passage images and let AI extract content
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link to="/admin/passages">
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                          <BookOpen className="h-5 w-5 text-emerald-400" />
                        </div>
                        Passage Library
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        View and manage all passages
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Tests</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadApiTests}
              disabled={isLoadingTests}
              className="text-slate-400 hover:text-white"
            >
              {isLoadingTests ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>

          {testsError && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{testsError}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingTests ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          ) : apiTests.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-400">No tests created yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Create your first test to get started!
                    </p>
                  </div>
                  <Link to="/admin/test/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Test
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiTests.slice(0, 5).map((test) => (
                <Link key={test.test_id} to={`/admin/test/${test.test_id}`}>
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-white group-hover:text-indigo-300 transition-colors">{test.title}</CardTitle>
                          <CardDescription className="text-slate-400">
                            Created by {test.created_by.full_name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
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
                              test.type === 'FULL_TEST'
                                ? 'border-indigo-500/30 text-indigo-300'
                                : 'border-purple-500/30 text-purple-300'
                            }
                          >
                            {test.type === 'FULL_TEST' ? 'Full Test' : 'Single Passage'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {test.passage_count} passage(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {test.total_questions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {test.time_limit_minutes} minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          {test.total_points} points
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
