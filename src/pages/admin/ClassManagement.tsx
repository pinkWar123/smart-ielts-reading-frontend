import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClassStore } from '@/lib/stores/classStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Plus,
  ChevronLeft,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  X,
  Search,
  UserPlus,
  UserMinus,
  Archive,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Class, User } from '@/lib/api/sessions';

export const ClassManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    classes,
    selectedClass,
    availableStudents,
    loading,
    error,
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    enrollStudent,
    removeStudent,
    fetchAvailableStudents,
    setSelectedClass,
    clearError,
  } = useClassStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchAvailableStudents();
  }, [fetchClasses, fetchAvailableStudents]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClass({
        name: newClassName,
        description: newClassDescription || null,
      });
      setNewClassName('');
      setNewClassDescription('');
      setShowCreateForm(false);
      clearError();
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleViewClass = async (classId: string) => {
    try {
      await fetchClassById(classId);
      setShowClassDetails(true);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleEnrollStudent = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await enrollStudent(selectedClass.id, studentId);
      await fetchClassById(selectedClass.id); // Refresh
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await removeStudent(selectedClass.id, studentId);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleArchiveClass = async (classId: string) => {
    if (!confirm('Are you sure you want to archive this class?')) return;
    try {
      await deleteClass(classId);
      setShowClassDetails(false);
      setSelectedClass(null);
    } catch (err) {
      // Error is handled by store
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableStudents = availableStudents.filter((s) =>
    `${s.full_name} ${s.email}`.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const enrolledStudentIds = selectedClass?.student_ids || [];
  const unenrolledStudents = filteredAvailableStudents.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  );

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
                onClick={() => navigate('/admin')}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
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
            <h1 className="text-3xl font-bold text-white mb-2">Class Management</h1>
            <p className="text-slate-400">Create and manage teaching classes</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Class Form */}
        {showCreateForm && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Create New Class</CardTitle>
              <CardDescription>Add a new teaching class</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Class Name
                  </label>
                  <Input
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., Beacon 31"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Description (optional)
                  </label>
                  <Textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Class description..."
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
                      'Create Class'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewClassName('');
                      setNewClassDescription('');
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        {/* Classes List */}
        {loading && !showClassDetails ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-slate-400">Loading classes...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredClasses.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12">
              <p className="text-center text-slate-500">No classes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((class_) => (
              <Card
                key={class_.id}
                className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewClass(class_.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white">{class_.name}</CardTitle>
                    <Badge
                      variant={class_.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        class_.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }
                    >
                      {class_.status}
                    </Badge>
                  </div>
                  {class_.description && (
                    <CardDescription className="text-slate-400">
                      {class_.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{class_.student_ids.length} students</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Class Details Modal */}
        {showClassDetails && selectedClass && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">{selectedClass.name}</CardTitle>
                    {selectedClass.description && (
                      <CardDescription className="text-slate-400 mt-1">
                        {selectedClass.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowClassDetails(false);
                      setSelectedClass(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enrolled Students */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Enrolled Students</h3>
                  {selectedClass.student_ids.length === 0 ? (
                    <p className="text-slate-500">No students enrolled yet</p>
                  ) : (
                    <div className="space-y-2">
                      {availableStudents
                        .filter((s) => selectedClass.student_ids.includes(s.id))
                        .map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                          >
                            <div>
                              <p className="text-white font-medium">{student.full_name}</p>
                              <p className="text-sm text-slate-400">{student.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Add Student */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Add Student</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search students..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  {unenrolledStudents.length === 0 ? (
                    <p className="text-slate-500">No available students</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {unenrolledStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{student.full_name}</p>
                            <p className="text-sm text-slate-400">{student.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnrollStudent(student.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <Button
                    onClick={() => navigate(`/admin/sessions?classId=${selectedClass.id}`)}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    View Sessions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleArchiveClass(selectedClass.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

