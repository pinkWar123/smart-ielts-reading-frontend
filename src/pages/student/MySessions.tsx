import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { useClassStore } from '@/lib/stores/classStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  ChevronRight,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Session, SessionStatus } from '@/lib/api/sessions';

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

const getStatusLabel = (status: SessionStatus): string => {
  switch (status) {
    case 'SCHEDULED':
      return 'Scheduled';
    case 'WAITING_FOR_STUDENTS':
      return 'Waiting Room Open';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const MySessions: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sessions, loading, error, fetchMySessions } = useSessionStore();
  const { classes, fetchClasses } = useClassStore();

  useEffect(() => {
    fetchMySessions();
    fetchClasses();
  }, [fetchMySessions, fetchClasses]);

  const handleJoinSession = (session: Session) => {
    if (session.status === 'SCHEDULED') {
      // Can't join yet
      return;
    } else if (session.status === 'WAITING_FOR_STUDENTS') {
      navigate(`/student/sessions/${session.id}/waiting`);
    } else if (session.status === 'IN_PROGRESS') {
      navigate(`/student/sessions/${session.id}/test`);
    } else if (session.status === 'COMPLETED') {
      navigate(`/student/sessions/${session.id}/results`);
    }
  };

  const getClassName = (classId: string): string => {
    const class_ = classes.find((c) => c.id === classId);
    return class_?.name || 'Unknown Class';
  };

  const scheduledSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const activeSessions = sessions.filter(
    (s) => s.status === 'WAITING_FOR_STUDENTS' || s.status === 'IN_PROGRESS'
  );
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IE</span>
                </div>
                <span className="font-semibold text-white">IELTS Practice</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                <GraduationCap className="h-3 w-3 mr-1" />
                Student
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
                onClick={() => navigate('/student')}
                className="text-slate-400 hover:text-white"
              >
                Dashboard
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
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Sessions</h1>
          <p className="text-slate-400">View and join your exercise sessions</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Active Sessions */}
        {loading ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-slate-400">Loading sessions...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Active Sessions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-white">{session.title}</CardTitle>
                          <Badge className={getStatusBadgeVariant(session.status)}>
                            {getStatusLabel(session.status)}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400">
                          {getClassName(session.class_id)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(session.scheduled_at).toLocaleString()}</span>
                        </div>
                        {session.started_at && (
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>Started: {new Date(session.started_at).toLocaleTimeString()}</span>
                          </div>
                        )}
                        <Button
                          onClick={() => handleJoinSession(session)}
                          className="w-full bg-green-600 hover:bg-green-500"
                        >
                          {session.status === 'WAITING_FOR_STUDENTS'
                            ? 'Enter Waiting Room'
                            : 'Continue Test'}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled Sessions */}
            {scheduledSessions.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Upcoming Sessions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scheduledSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-white">{session.title}</CardTitle>
                          <Badge className={getStatusBadgeVariant(session.status)}>
                            {getStatusLabel(session.status)}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400">
                          {getClassName(session.class_id)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(session.scheduled_at).toLocaleString()}</span>
                        </div>
                        <Button
                          disabled
                          variant="outline"
                          className="w-full border-slate-700 text-slate-500"
                        >
                          Not Available Yet
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Sessions */}
            {completedSessions.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Completed Sessions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="bg-slate-900/50 border-slate-800 hover:border-slate-500/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-white">{session.title}</CardTitle>
                          <Badge className={getStatusBadgeVariant(session.status)}>
                            {getStatusLabel(session.status)}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400">
                          {getClassName(session.class_id)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(session.scheduled_at).toLocaleString()}</span>
                        </div>
                        {session.completed_at && (
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>
                              Completed: {new Date(session.completed_at).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => handleJoinSession(session)}
                          variant="outline"
                          className="w-full border-slate-700 hover:bg-slate-800"
                        >
                          View Results
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* No Sessions */}
            {sessions.length === 0 && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <p className="text-center text-slate-500">No sessions found</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

