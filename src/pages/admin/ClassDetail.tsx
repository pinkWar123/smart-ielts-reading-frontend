import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useClassStore } from '@/lib/stores/classStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  ChevronLeft,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Archive,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { UserSearchSelect } from '@/components/admin/UserSearchSelect';
import { sessionsApi, type UserInfo } from '@/lib/api/sessions';

export const ClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { user, logout } = useAuthStore();
  const {
    selectedClass,
    loading,
    error,
    fetchClassById,
    deleteClass,
    clearError,
  } = useClassStore();

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchClassById(classId);
    }
  }, [classId, fetchClassById]);

  const handleArchiveClass = async () => {
    if (!classId) return;
    if (!confirm('Are you sure you want to archive this class?')) return;
    try {
      await deleteClass(classId);
      navigate('/admin/classes');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleAddStudent = async (student: UserInfo) => {
    if (!classId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await sessionsApi.enrollStudent(classId, student.id);
      await fetchClassById(classId); // Refresh data
      setShowAddStudent(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTeacher = async (teacher: UserInfo) => {
    if (!classId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await sessionsApi.addTeacher(classId, teacher.id);
      await fetchClassById(classId); // Refresh data
      setShowAddTeacher(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add teacher');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!classId) return;
    if (!confirm(`Are you sure you want to remove ${studentName} from this class?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await sessionsApi.removeStudent(classId, studentId);
      await fetchClassById(classId); // Refresh data
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string, teacherName: string) => {
    if (!classId) return;
    if (!confirm(`Are you sure you want to remove ${teacherName} from this class?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await sessionsApi.removeTeacher(classId, teacherId);
      await fetchClassById(classId); // Refresh data
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove teacher');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-slate-400">Loading class details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <p className="text-center text-slate-500">Class not found</p>
              <div className="mt-4 text-center">
                <Button onClick={() => navigate('/admin/classes')} variant="outline">
                  Back to Classes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                Back to Classes
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
        {/* Error Alert */}
        {(error || actionError) && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || actionError}</AlertDescription>
          </Alert>
        )}

        {/* Class Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{selectedClass.name}</h1>
              <Badge
                variant={selectedClass.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={
                  selectedClass.status === 'ACTIVE'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }
              >
                {selectedClass.status}
              </Badge>
            </div>
            {selectedClass.description && (
              <p className="text-slate-400">{selectedClass.description}</p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Created by {selectedClass.created_by.full_name} on{' '}
              {new Date(selectedClass.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleArchiveClass}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive Class
          </Button>
        </div>

        {/* Teachers Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Teachers</CardTitle>
                <CardDescription>Teachers assigned to this class</CardDescription>
              </div>
              {!showAddTeacher && (
                <Button
                  size="sm"
                  onClick={() => setShowAddTeacher(true)}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Teacher Search */}
            {showAddTeacher && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-white mb-3">Search for a teacher</h4>
                <UserSearchSelect
                  role="TEACHER"
                  onSelect={handleAddTeacher}
                  onCancel={() => setShowAddTeacher(false)}
                  excludeIds={selectedClass.teachers.map((t) => t.id)}
                  placeholder="Search by name or email..."
                />
              </div>
            )}

            {/* Teachers List */}
            {selectedClass.teachers.length === 0 ? (
              <p className="text-slate-500">No teachers assigned yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClass.teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{teacher.full_name}</p>
                        <p className="text-sm text-slate-400">{teacher.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeacher(teacher.id, teacher.full_name)}
                      disabled={actionLoading}
                      className="text-red-400 hover:text-red-300"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Students</CardTitle>
                <CardDescription>Students enrolled in this class</CardDescription>
              </div>
              {!showAddStudent && (
                <Button
                  size="sm"
                  onClick={() => setShowAddStudent(true)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Student Search */}
            {showAddStudent && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-white mb-3">Search for a student</h4>
                <UserSearchSelect
                  role="STUDENT"
                  onSelect={handleAddStudent}
                  onCancel={() => setShowAddStudent(false)}
                  excludeIds={selectedClass.students.map((s) => s.id)}
                  placeholder="Search by name or email..."
                />
              </div>
            )}

            {/* Students List */}
            {selectedClass.students.length === 0 ? (
              <p className="text-slate-500">No students enrolled yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClass.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.full_name}</p>
                        <p className="text-sm text-slate-400">{student.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStudent(student.id, student.full_name)}
                      disabled={actionLoading}
                      className="text-red-400 hover:text-red-300"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions Link */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-6">
            <Button
              onClick={() => navigate(`/admin/sessions?classId=${selectedClass.id}`)}
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              View Sessions for this Class
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
