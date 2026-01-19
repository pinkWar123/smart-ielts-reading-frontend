import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useClassStore } from '@/lib/stores/classStore';
import { testsApi, type TestListItem } from '@/lib/api/tests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Plus,
  ChevronLeft,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  Play,
  CheckCircle,
  Trash2,
  Eye,
  Clock,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Session, SessionStatus } from '@/lib/api/sessions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const getStatusBadgeVariant = (status: SessionStatus) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'WAITING_FOR_STUDENTS':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'IN_PROGRESS':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'COMPLETED':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export const SessionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const { user, logout } = useAuthStore();
  const {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    startWaitingPhase,
    startSession,
    completeSession,
    deleteSession,
    clearError,
  } = useSessionStore();
  const { classes, fetchClasses } = useClassStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classId || '');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    loadTests();
  }, [fetchSessions, fetchClasses]);

  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId);
    }
  }, [classId]);

  const loadTests = async () => {
    setLoadingTests(true);
    try {
      const response = await testsApi.getAllTests('PUBLISHED');
      setTests(response.tests);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedTestId || !sessionTitle || !scheduledAt) {
      return;
    }

    try {
      await createSession({
        class_id: selectedClassId,
        test_id: selectedTestId,
        title: sessionTitle,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      setShowCreateForm(false);
      setSelectedClassId(classId || '');
      setSelectedTestId('');
      setSessionTitle('');
      setScheduledAt('');
      clearError();
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleStartWaiting = async (sessionId: string) => {
    try {
      await startWaitingPhase(sessionId);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await startSession(sessionId);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to complete this session?')) return;
    try {
      await completeSession(sessionId);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSession(sessionId);
    } catch (err) {
      // Error is handled by store
    }
  };

  const filteredSessions = classId
    ? sessions.filter((s) => s.class_id === classId)
    : sessions;

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2">
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
                onClick={() => navigate('/admin/classes')}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Classes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
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
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Session Management</h1>
            <p className="text-slate-400">
              {classId && selectedClass
                ? `Sessions for ${selectedClass.name}`
                : 'Create and manage exercise sessions'}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Session Form */}
        {showCreateForm && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Create New Session</CardTitle>
              <CardDescription>Schedule a new exercise session</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Class</label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {classes
                        .filter((c) => c.status === 'ACTIVE')
                        .map((class_) => (
                          <SelectItem key={class_.id} value={class_.id} className="text-white">
                            {class_.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Test</label>
                  <Select value={selectedTestId} onValueChange={setSelectedTestId} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {loadingTests ? (
                        <SelectItem value="loading" disabled>
                          Loading tests...
                        </SelectItem>
                      ) : (
                        tests.map((test) => (
                          <SelectItem key={test.test_id} value={test.test_id} className="text-white">
                            {test.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Session Title
                  </label>
                  <Input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="e.g., Weekly Practice Session"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Scheduled Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Session'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedClassId(classId || '');
                      setSelectedTestId('');
                      setSessionTitle('');
                      setScheduledAt('');
                      clearError();
                    }}
                    className="border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        {loading ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-slate-400">Loading sessions...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredSessions.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <p className="text-center text-slate-500">No sessions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white">{session.title}</CardTitle>
                    <Badge className={getStatusBadgeVariant(session.status)}>
                      {session.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    {new Date(session.scheduled_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{session.participants.length} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {session.started_at
                        ? `Started: ${new Date(session.started_at).toLocaleTimeString()}`
                        : 'Not started'}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {session.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartWaiting(session.id)}
                        className="bg-yellow-600 hover:bg-yellow-500"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Open Waiting Room
                      </Button>
                    )}
                    {session.status === 'WAITING_FOR_STUDENTS' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSession(session.id)}
                        className="bg-green-600 hover:bg-green-500"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Session
                      </Button>
                    )}
                    {session.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/sessions/${session.id}/monitor`)}
                          className="bg-indigo-600 hover:bg-indigo-500"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Monitor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteSession(session.id)}
                          className="border-orange-500/50 text-orange-400"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {session.status !== 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSession(session.id)}
                        className="border-red-500/50 text-red-400"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

