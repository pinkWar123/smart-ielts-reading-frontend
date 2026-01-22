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
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

export const ClassManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    clearError,
  } = useClassStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // If teacher, only fetch their classes. If admin, fetch all classes.
    const teacherId = user?.role === 'TEACHER' ? user.user_id : undefined;
    fetchClasses(teacherId);
  }, [fetchClasses, user]);

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

  const handleViewClass = (classId: string) => {
    navigate(`/admin/classes/${classId}`);
  };

  const filteredClasses = classes?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

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
        {loading ? (
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
                    <span>{class_.students_count} students</span>
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

